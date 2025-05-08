import torch
import numpy as np
from PIL import Image
import torch.nn as nn
from torchvision import transforms
import os
import sys
import argparse
from typing import Tuple, List, Dict, Optional

class PatchEmbedding(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_chans=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.n_patches = (img_size // patch_size) ** 2
        
        self.proj = nn.Conv2d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)
    
    def forward(self, x):
        x = self.proj(x)
        x = x.flatten(2)
        x = x.transpose(1, 2)
        return x

class Attention(nn.Module):
    def __init__(self, dim, num_heads=8, qkv_bias=False, attn_drop=0., proj_drop=0.):
        super().__init__()
        self.num_heads = num_heads
        head_dim = dim // num_heads
        self.scale = head_dim ** -0.5
        
        self.qkv = nn.Linear(dim, dim * 3, bias=qkv_bias)
        self.attn_drop = nn.Dropout(attn_drop)
        self.proj = nn.Linear(dim, dim)
        self.proj_drop = nn.Dropout(proj_drop)
    
    def forward(self, x):
        B, N, C = x.shape
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, C // self.num_heads).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]
        
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        attn = self.attn_drop(attn)
        
        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        x = self.proj_drop(x)
        return x

class MLP(nn.Module):
    def __init__(self, in_features, hidden_features, out_features, drop=0.):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden_features)
        self.act = nn.GELU()
        self.fc2 = nn.Linear(hidden_features, out_features)
        self.drop = nn.Dropout(drop)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.act(x)
        x = self.drop(x)
        x = self.fc2(x)
        x = self.drop(x)
        return x

class TransformerBlock(nn.Module):
    def __init__(self, dim, num_heads, mlp_ratio=4., qkv_bias=False, drop=0., attn_drop=0.):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = Attention(dim, num_heads=num_heads, qkv_bias=qkv_bias, attn_drop=attn_drop, proj_drop=drop)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = MLP(in_features=dim, hidden_features=int(dim * mlp_ratio), out_features=dim, drop=drop)
    
    def forward(self, x):
        x = x + self.attn(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x

class VisionTransformer(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_chans=3, num_classes=1000, embed_dim=768, depth=12,
                 num_heads=12, mlp_ratio=4., qkv_bias=True, drop_rate=0.1, attn_drop_rate=0.):
        super().__init__()
        self.num_classes = num_classes
        self.num_features = embed_dim
        self.embed_dim = embed_dim
        
        self.patch_embed = PatchEmbedding(img_size=img_size, patch_size=patch_size, in_chans=in_chans, embed_dim=embed_dim)
        num_patches = self.patch_embed.n_patches
        
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.pos_drop = nn.Dropout(p=drop_rate)
        
        self.blocks = nn.ModuleList([
            TransformerBlock(
                dim=embed_dim, num_heads=num_heads, mlp_ratio=mlp_ratio, qkv_bias=qkv_bias,
                drop=drop_rate, attn_drop=attn_drop_rate)
            for _ in range(depth)])
        
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)
    
    def forward(self, x):
        B = x.shape[0]
        x = self.patch_embed(x)
        
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        x = x + self.pos_embed
        x = self.pos_drop(x)
        
        for blk in self.blocks:
            x = blk(x)
        
        x = self.norm(x)
        x = self.head(x[:, 0])
        return x

def load_model(model_path: str, num_classes: int, device: torch.device) -> VisionTransformer:
    mdl = VisionTransformer(
        img_size=224,
        patch_size=16,
        in_chans=3,
        num_classes=num_classes,
        embed_dim=384,
        depth=8,
        num_heads=6,
        mlp_ratio=3.,
        qkv_bias=True,
        drop_rate=0.1
    )
    
    mdl.load_state_dict(torch.load(model_path, map_location=device))
    mdl.to(device)
    mdl.eval()
    return mdl

def process_image(img_path: str, tfms) -> torch.Tensor:
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image not found: {img_path}")
    
    img = Image.open(img_path).convert('RGB')
    tensor = tfms(img).unsqueeze(0)
    return tensor

def get_top_predictions(output: torch.Tensor, class_names: List[str], top_k: int = 3) -> List[Tuple[str, float]]:
    probs = torch.nn.functional.softmax(output, dim=1)[0]
    top_probs, top_idxs = torch.topk(probs, top_k)
    
    return [(class_names[idx], prob.item()) for idx, prob in zip(top_idxs, top_probs)]

def batch_inference(model: nn.Module, img_paths: List[str], class_names: List[str], 
                    device: torch.device, batch_size: int = 8) -> Dict[str, List[Tuple[str, float]]]:
    tfms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    results = {}
    
    for i in range(0, len(img_paths), batch_size):
        batch_paths = img_paths[i:i + batch_size]
        batch_imgs = []
        
        for path in batch_paths:
            try:
                img_tensor = process_image(path, tfms)
                batch_imgs.append(img_tensor)
            except Exception as e:
                print(f"Error processing {path}: {e}")
                continue
        
        if not batch_imgs:
            continue
        
        batch_tensor = torch.cat(batch_imgs).to(device)
        
        with torch.no_grad():
            batch_output = model(batch_tensor)
        
        for j, path in enumerate(batch_paths[:len(batch_imgs)]):
            preds = get_top_predictions(batch_output[j:j+1], class_names)
            results[path] = preds
    
    return results

def main():
    parser = argparse.ArgumentParser(description="Food classifier inference")
    parser.add_argument("--model", type=str, required=True, help="Path to model weights")
    parser.add_argument("--img_dir", type=str, default=None, help="Directory containing images to classify")
    parser.add_argument("--img", type=str, default=None, help="Single image to classify")
    parser.add_argument("--out", type=str, default="results.txt", help="Output file for results")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size for inference")
    args = parser.parse_args()
    
    if not args.img and not args.img_dir:
        parser.error("Either --img or --img_dir must be specified")
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    food_classes = ['apple', 'banana', 'broccoli', 'burger', 'carrot', 'donut', 'fries', 'hotdog', 'pizza', 'salad']
    model = load_model(args.model, len(food_classes), device)
    
    if args.img:
        tfms = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        try:
            img_tensor = process_image(args.img, tfms).to(device)
            
            with torch.no_grad():
                output = model(img_tensor)
            
            preds = get_top_predictions(output, food_classes)
            
            print(f"\nResults for {args.img}:")
            for cls, prob in preds:
                print(f"{cls}: {prob:.4f} ({prob*100:.2f}%)")
                
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
    
    elif args.img_dir:
        if not os.path.isdir(args.img_dir):
            print(f"Directory not found: {args.img_dir}")
            sys.exit(1)
        
        img_exts = ['.jpg', '.jpeg', '.png', '.bmp']
        img_paths = []
        
        for root, _, files in os.walk(args.img_dir):
            for file in files:
                if any(file.lower().endswith(ext) for ext in img_exts):
                    img_paths.append(os.path.join(root, file))
        
        if not img_paths:
            print(f"No valid images found in {args.img_dir}")
            sys.exit(1)
        
        print(f"Found {len(img_paths)} images. Processing...")
        
        results = batch_inference(model, img_paths, food_classes, device, args.batch_size)
        
        with open(args.out, 'w') as f:
            for path, preds in results.items():
                f.write(f"{path}\n")
                for cls, prob in preds:
                    f.write(f"  {cls}: {prob:.4f} ({prob*100:.2f}%)\n")
                f.write("\n")
        
        print(f"Results saved to {args.out}")

if __name__ == "__main__":
    main()