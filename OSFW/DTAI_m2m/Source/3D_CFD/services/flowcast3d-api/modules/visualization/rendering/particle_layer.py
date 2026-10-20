import itertools
import math

import numpy as np
import pyvista as pv
import vtk

from modules.domain.transport import particles as physics


class ParticleLayer:
    def __init__(self, scene, count, seed=0):
        self.scene, self.frozen = scene, scene.result.n_frames == 1
        self.particles = physics.Particles(count, seed)
        index = np.arange(count)
        self.data = pv.PolyData(
            np.zeros((2 * count, 3), dtype=np.float32),
            verts=np.column_stack([np.ones(count, dtype=np.int64), count + index]).ravel(),
            lines=np.column_stack([np.full(count, 2), index, count + index]).ravel(),
        )
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputData(self.data)
        self.actor = pv.Actor(mapper=mapper)
        self.actor.prop.color = physics.COLORS[self.frozen]
        self.actor.prop.lighting = False
        self.actor.prop.point_size = 5.0 * scene.scale
        self.actor.prop.line_width = 1.5 * scene.scale
        self.actor.prop.render_points_as_spheres = True
        scene.plotter.add_actor(self.actor, reset_camera=False, render=False)

    def pair(self, position):
        settings = self.scene.settings
        return self.scene.fields.pair(position, settings.roi, settings.max_cells)

    def advance(self, start, end, time_step):
        """건너뛴 프레임도 경계마다 나눠 속도 보간"""
        cuts = [start, *range(math.floor(start) + 1, math.ceil(end)), end]
        for before, after in itertools.pairwise(cuts):
            if after > before:
                span = after - before
                if self.scene.fields.wind is not None:
                    settings = self.scene.settings
                    first = self.scene.fields.at(before, settings.roi, settings.max_cells)
                    second = self.scene.fields.at(after, settings.roi, settings.max_cells)
                    self.particles.advance(first, second, span * time_step, span)
                else:
                    first, second, phase = self.pair(before)
                    self.particles.advance(first, second, span * time_step, span, (phase, phase + span))
        self.trail(end, time_step)
        self.draw()

    def seed(self, position, time_step):
        self.particles.seed(self.pair(position)[0])
        self.trail(position, time_step)
        self.draw()

    def trail(self, position, time_step):
        """재생 속도와 무관하게 한 프레임 이동 거리로 꼬리 표시"""
        first, second, phase = self.pair(position)
        points = self.particles.points
        if self.scene.fields.wind is not None:
            settings = self.scene.settings
            speed = self.scene.fields.at(position, settings.roi, settings.max_cells).velocity_at(points)
        else:
            speed = first.velocity_at(points)
        if second is not first and self.scene.fields.wind is None:
            speed = (1 - phase) * speed + phase * second.velocity_at(points)
        back = time_step * speed
        limit = np.where(back > 0, first.bounds[0], first.bounds[1])
        with np.errstate(divide="ignore", invalid="ignore"):
            room = np.where(back != 0, (points - limit) / back, np.inf)
        self.particles.tails = points - np.clip(room.min(axis=1), 0, 1)[:, None] * back

    def draw(self):
        particles = self.particles
        self.data.points = (np.concatenate([particles.tails, particles.points]) - self.scene.origin).astype(
            np.float32
        )

    def close(self):
        self.scene.plotter.remove_actor(self.actor, reset_camera=False, render=False)
