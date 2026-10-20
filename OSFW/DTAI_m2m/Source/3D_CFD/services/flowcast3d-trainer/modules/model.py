from __future__ import annotations

import math
from typing import Any

import torch
from torch import nn
from torch.nn import functional as F


class _ConvBlock(nn.Module):
    def __init__(self, input_channels: int, output_channels: int):
        super().__init__()
        groups = math.gcd(8, output_channels)
        self.layers = nn.Sequential(
            nn.Conv3d(input_channels, output_channels, 3, padding=1, bias=False),
            nn.GroupNorm(groups, output_channels),
            nn.SiLU(inplace=True),
            nn.Conv3d(output_channels, output_channels, 3, padding=1, bias=False),
            nn.GroupNorm(groups, output_channels),
            nn.SiLU(inplace=True),
        )

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        return self.layers(values)


class _PressureRefinement(nn.Module):
    """좌표와 대기 조건으로 압력 잔차만 보완하는 head"""

    def __init__(self, feature_channels: int, hidden_channels: int | None = None):
        super().__init__()
        hidden_channels = feature_channels if hidden_channels is None else hidden_channels
        condition_channels = 8
        self.condition_embedding = nn.Sequential(nn.Linear(2, condition_channels), nn.SiLU())
        self.layers = nn.Sequential(
            nn.Conv3d(feature_channels + 3 + condition_channels, hidden_channels, 1),
            nn.SiLU(),
            nn.Conv3d(hidden_channels, hidden_channels, 3, padding=1),
            nn.SiLU(),
            nn.Conv3d(hidden_channels, 1, 1),
        )
        nn.init.zeros_(self.layers[-1].weight)
        nn.init.zeros_(self.layers[-1].bias)

    def forward(self, features: torch.Tensor, conditions: torch.Tensor) -> torch.Tensor:
        shape = features.shape[2:]
        axes = tuple((torch.arange(size, device=features.device, dtype=torch.float32) + .5)
                     * (2.0 / size) - 1.0 for size in shape)
        coordinates = torch.stack(torch.meshgrid(*axes, indexing="ij")[::-1], dim=0)
        coordinates = coordinates.to(dtype=features.dtype)[None].expand(features.shape[0], -1, *shape)
        condition = self.condition_embedding(conditions[:, 6:8]).to(dtype=features.dtype)
        condition = condition[:, :, None, None, None].expand(-1, -1, *shape)
        return self.layers(torch.cat((features, coordinates, condition), dim=1))


class TransUNet3D(nn.Module):
    def __init__(self, config: dict[str, Any] | None = None, **overrides: Any):
        super().__init__()
        config = {**(config or {}), **overrides}
        self.input_channels = int(config.get("input_channels", 16))
        self.condition_dim = int(config.get("condition_dim", 11))
        base = int(config.get("base_channels", 16))
        heads = int(config.get("attention_heads", 4))
        layers = int(config.get("transformer_layers", 2))
        dropout = float(config.get("dropout", 0.0))
        if min(self.input_channels, self.condition_dim, base, heads, layers) <= 0:
            raise ValueError("model dimensions must be positive")
        if base * 16 % heads or not 0 <= dropout < 1:
            raise ValueError("attention heads or dropout are invalid")
        channels = [base * 2 ** index for index in range(5)]
        self.encoders = nn.ModuleList(
            _ConvBlock(self.input_channels if index == 0 else channels[index - 1], channel)
            for index, channel in enumerate(channels)
        )
        self.pool = nn.MaxPool3d(2, ceil_mode=True)
        embedding = channels[-1]
        self.position_embedding = nn.Sequential(nn.Linear(3, embedding), nn.SiLU(), nn.Linear(embedding, embedding))
        self.condition_embedding = nn.Sequential(nn.Linear(self.condition_dim, embedding), nn.SiLU(), nn.Linear(embedding, embedding))
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embedding,
            nhead=heads,
            dim_feedforward=embedding * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, layers, norm=nn.LayerNorm(embedding), enable_nested_tensor=False)
        self.decoders = nn.ModuleList(
            _ConvBlock(channels[index + 1] + channels[index], channels[index])
            for index in reversed(range(4))
        )
        self.output = nn.Conv3d(base, 4, 1)
        refinement = config.get("pressure_refinement", False)
        frozen = config.get("frozen_backbone", False)
        if not isinstance(refinement, bool) or not isinstance(frozen, bool):
            raise ValueError("pressure_refinement and frozen_backbone must be bool")
        if frozen and not refinement:
            raise ValueError("frozen_backbone requires pressure_refinement")
        if refinement and self.condition_dim != 11:
            raise ValueError("pressure refinement requires 11 conditions")
        refinement_channels = config.get("pressure_refinement_channels", base)
        if (isinstance(refinement_channels, bool) or not isinstance(refinement_channels, int)
                or refinement_channels < 1):
            raise ValueError("pressure_refinement_channels must be a positive integer")
        self.pressure_refinement = _PressureRefinement(base, refinement_channels) if refinement else None
        self.frozen_backbone = frozen
        if frozen:
            for name, parameter in self.named_parameters():
                parameter.requires_grad_(name.startswith("pressure_refinement."))
            self.train(self.training)

    def train(self, mode: bool = True) -> TransUNet3D:
        """압력 head 학습 중에도 동결한 기존 모델은 평가 모드 유지"""
        super().train(mode)
        if getattr(self, "frozen_backbone", False):
            for name, module in self.named_children():
                if name != "pressure_refinement":
                    module.eval()
        return self

    def forward(self, spatial: torch.Tensor, conditions: torch.Tensor) -> torch.Tensor:
        # 입력 규격과 토큰 예산 검사
        if spatial.ndim != 5 or spatial.shape[1] != self.input_channels:
            raise ValueError("spatial must have shape [B,input_channels,Z,Y,X]")
        if conditions.shape != (spatial.shape[0], self.condition_dim):
            raise ValueError("conditions must have shape [B,condition_dim]")
        if min(spatial.shape[2:]) < 16:
            raise ValueError("each spatial dimension must contain at least 16 cells")
        if math.prod((size + 15) // 16 for size in spatial.shape[2:]) > 512:
            raise ValueError("bottleneck exceeds 512 tokens; reduce grid size")

        # 인코더 특징 추출
        skips = []
        values = spatial
        for index, encoder in enumerate(self.encoders):
            if index:
                values = self.pool(values)
            values = encoder(values)
            skips.append(values)

        # 위치와 대기 조건을 결합한 Transformer 계산
        shape = values.shape[2:]
        coordinates = torch.meshgrid(
            *((torch.arange(size, device=values.device, dtype=values.dtype) + .5) * 2 / size - 1
              for size in shape),
            indexing="ij",
        )
        positions = torch.stack(coordinates[::-1], dim=-1).reshape(-1, 3)
        tokens = values.flatten(2).transpose(1, 2)
        tokens = tokens + self.position_embedding(positions)[None] + self.condition_embedding(conditions)[:, None]
        values = self.transformer(tokens).transpose(1, 2).reshape(values.shape)

        # 디코더와 압력 보완
        for decoder, skip in zip(self.decoders, reversed(skips[:-1])):
            values = F.interpolate(values, size=skip.shape[2:], mode="trilinear", align_corners=False)
            values = decoder(torch.cat((values, skip), dim=1))
        output = self.output(values)
        if self.pressure_refinement is None:
            return output
        pressure = output[:, 3:4] + self.pressure_refinement(values, conditions)
        return torch.cat((output[:, :3], pressure), dim=1)


def build_model(model_config: dict[str, Any] | None = None) -> TransUNet3D:
    return TransUNet3D(model_config)
