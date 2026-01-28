import type { ConcentrationDiffusionLBMData } from '../../../../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM';
import { CONCENTRATION_DIFFUSION_LBM_DEFAULT_VALUES } from '../../../../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM';

/**
 * ConcentrationDiffusionLBM 폼 데이터를 JSON 형식으로 변환
 * @param formData ConcentrationDiffusionLBMData 타입의 폼 데이터
 * @returns 변환된 JSON 객체
 */
export function convertConcentrationDiffusionLBM(formData: ConcentrationDiffusionLBMData | null | undefined): any {
  // null/undefined인 경우 기본값 사용
  const data = formData || CONCENTRATION_DIFFUSION_LBM_DEFAULT_VALUES;
  console.log('[convertConcentrationDiffusionLBM] Input:', data);

  const result = {
    meta: {
      version: 202410,
      title: ""
    },
    config: {
      solver_common: {
        solver_type: "concentration_diffusion",
        collision_model: "Cumulant_HR_D3Q27",
        simulation_start_time: 0.0,
        simulation_end_time: data.endTime,
        time_step: data.timeStep,
        devices: [0]
      },
      initial_conditions: [
        {
          is_main_initial_condition: true,
          pressure: data.initialPressure,
          velocity: [data.initialVelocityX, data.initialVelocityY, data.initialVelocityZ],
          concentration_point: [data.initialConcentrationPointX, data.initialConcentrationPointY, data.initialConcentrationPointZ],
          concentration_width: data.initialConcentrationWidth
        }
      ],
      source_terms: {
        momentum_source: [0.0, 0.0, 0.0],
        gravity: [0.0, 0.0, 0.0]
      },
      materials: [
        {
          name: "air",
          is_main_material: true,
          phase: "gas",
          density: data.density,
          kinematic_viscosity: data.kinematicViscosity,
          diffusivity1: data.diffusivity1,
          diffusivity2: data.diffusivity2,
          diffusivity3: data.diffusivity3
        },
        {
          name: "Duralumin A6061",
          is_main_material: false,
          phase: "solid",
          density: 1.0,
          kinematic_viscosity: 0.0
        }
      ],
      model_settings: {
        turbulence_model: "LES",
        smagorinsky_constant: 0.2,
        K: 0.41,
        B: 5
      },
      concentration_diffusion_settings: {
        turbulent_schmidt: 1.0,
        sigma_HR: 1.0
      },
      outer_boundary_condition: {
        xmin: { type: "periodic" },
        xmax: { type: "periodic" },
        ymin: { type: "periodic" },
        ymax: { type: "periodic" },
        zmin: { type: "periodic" },
        zmax: { type: "periodic" }
      },
      lattice_generation: [
        {
          inertial_frame: true,
          position: [0.0, 0.0, 0.0],
          angular_velocity: [0.0, 0.0, 0.0],
          domain_general: false,
          base_dx: 1.0,
          base_region: {
            min: [data.domainMinX, data.domainMinY, data.domainMinZ],
            max: [data.domainMaxX, data.domainMaxY, data.domainMaxZ]
          },
          regional_segment: []
        }
      ],
      result_report: {
        export_path: "",
        export_format: ["BINARY_VTK", "NFILE"],
        save_start_time: 0.0,
        save_end_time: data.endTime,
        save_time_interval: data.saveInterval,
        items: {
          density: true,
          pressure: true,
          dynamic_viscosity: false,
          kinematic_viscosity: false,
          turbulent_viscosity: false,
          smagorinsky_constant: false,
          y_plus: false,
          friction_velocity: false,
          wall_shear_stress: false,
          wall_noremal_stress: false,
          concentration1: true,
          concentration2: true,
          concentration3: true,
          velocity: true,
          wall_normal: false,
          "Q-gradient": false,
          angular_velocity: false,
          momentum_source: false,
          interface_normal: false,
          gravity: false,
          cell_center: false,
          projection_point: false,
          net_force: false,
          body_force: false,
          temperature: false,
          artificial_viscosity: false,
          diffusion_coefficient: false,
          u_plus: false,
          wall_shear_coefficient: false,
          pressure_coefficient: false
        },
        cell_flags: {
          gas: false,
          vapor: false,
          liquid: false,
          solid: true,
          supercritical: false,
          ftor: false,
          rtof: false,
          boundary_conservation: false,
          boundary_specified: false,
          boundary_flux: false,
          boundary_non_reflecting: false,
          boundary_absorbing: false,
          boundary_inlet: true,
          boundary_wallmodel: true,
          boundary_wall: true,
          boundary_moving_wall: true,
          boundary_farfield: true,
          boundary_outlet: true,
          boundary_slip: false,
          boundary_symmetry: true,
          boundary_symmetry_x: false,
          boundary_symmetry_y: false,
          boundary_symmetry_z: false,
          boundary_periodic: true,
          boundary_periodic_x: false,
          boundary_periodic_y: false,
          boundary_periodic_z: false,
          boundary_xmin: false,
          boundary_xmax: false,
          boundary_ymin: false,
          boundary_ymax: false,
          boundary_zmin: false,
          boundary_zmax: false,
          erase_later: false
        }
      }
    }
  };

  console.log('[convertConcentrationDiffusionLBM] Result:', result);
  return result;
}
