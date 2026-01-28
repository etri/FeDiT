import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import type { FormRef } from "../../../../types/formTypes";
import useProjectStore from "../../../../stores/projectStore";
import "../../../../styles/formStyles.css";
import "../../../../styles/accordion-overrides.css";

export interface ConcentrationDiffusionLBMData {
  // Initial Conditions
  initialPressure: number;
  initialVelocityX: number;
  initialVelocityY: number;
  initialVelocityZ: number;
  initialConcentrationPointX: number;
  initialConcentrationPointY: number;
  initialConcentrationPointZ: number;
  initialConcentrationWidth: number;

  // Material properties
  density: number;
  kinematicViscosity: number;
  diffusivity1: number;
  diffusivity2: number;
  diffusivity3: number;

  // Lattice Generation
  domainMinX: number;
  domainMinY: number;
  domainMinZ: number;
  domainMaxX: number;
  domainMaxY: number;
  domainMaxZ: number;

  // Calculation settings
  endTime: number;
  timeStep: number;
  saveInterval: number;
}

interface ConcentrationDiffusionLBMProps {
  initialData?: Partial<ConcentrationDiffusionLBMData>;
  activeSection?: string;
  visible?: boolean;
}

// Export default values for initialization
export const CONCENTRATION_DIFFUSION_LBM_DEFAULT_VALUES: ConcentrationDiffusionLBMData = {
  // Initial Conditions
  initialPressure: 101325,
  initialVelocityX: 0.1,
  initialVelocityY: 0.1,
  initialVelocityZ: 0.0,
  initialConcentrationPointX: 0.0,
  initialConcentrationPointY: 200.0,
  initialConcentrationPointZ: 0.5,
  initialConcentrationWidth: 10.0,

  // Material properties
  density: 1.0, // kg/m³ (air)
  kinematicViscosity: 0.001, // m²/s (air)
  diffusivity1: 0.001,
  diffusivity2: 0.001,
  diffusivity3: 0.001,

  // Lattice Generation
  domainMinX: -200.0,
  domainMinY: 0.0,
  domainMinZ: 0.0,
  domainMaxX: 200.0,
  domainMaxY: 400.0,
  domainMaxZ: 1.0,

  // Calculation settings
  endTime: 400.0,
  timeStep: 1.0,
  saveInterval: 4.0,
};

// Export form sections metadata for menu generation
export const FORM_SECTIONS = [
  { key: 'initialConditions', label: 'Initial Conditions', icon: 'pi pi-map-marker' },
  { key: 'materials', label: 'Materials', icon: 'pi pi-box' },
  { key: 'concentrationDiffusion', label: 'Concentration Diffusion', icon: 'pi pi-megaphone' },
  { key: 'outerBoundaryConditions', label: 'Outer Boundary Conditions', icon: 'pi pi-hammer' },
  { key: 'latticeGeneration', label: 'Lattice Generation', icon: 'pi pi-table' },
  { key: 'calculation', label: 'Calculation', icon: 'pi pi-calculator' }
];

const ConcentrationDiffusionLBM = forwardRef<FormRef<ConcentrationDiffusionLBMData>, ConcentrationDiffusionLBMProps>((props, ref) => {
  const { initialData, activeSection, visible = true } = props;

  // Check if it's a new project by examining initialData content
  const isNewProject = !initialData || Object.keys(initialData).length === 0;

  const {
    control,  
    formState: { errors, touchedFields },
    getValues,
    trigger,
    setValue,
  } = useForm<ConcentrationDiffusionLBMData>({
    defaultValues: {
      ...CONCENTRATION_DIFFUSION_LBM_DEFAULT_VALUES,
      ...(isNewProject ? {} : initialData),
    }
  });

  // Watch all form data for store synchronization
  const allFormData = useWatch({ control });

  // Ref to track previous form data for comparison (prevents infinite loop)
  const prevFormDataRef = useRef<string>("");

  // Sync form data to store in real-time (with comparison to prevent infinite loop)
  useEffect(() => {
    const currentDataStr = JSON.stringify(allFormData);

    // Only update store if data actually changed
    if (currentDataStr !== prevFormDataRef.current) {
      prevFormDataRef.current = currentDataStr;
      useProjectStore.getState().setFormData(allFormData);
    }
  }, [allFormData]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getData: () => {
      return getValues();
    },
    validate: async () => {
      const result = await trigger();
      return result;
    },
    getErrors: () => errors,
    getTouchedFields: () => {
      const flattened: Partial<Record<keyof ConcentrationDiffusionLBMData, boolean>> = {};

      Object.keys(touchedFields).forEach((key) => {
        const value = touchedFields[key as keyof typeof touchedFields];
        if (typeof value === 'boolean') {
          flattened[key as keyof ConcentrationDiffusionLBMData] = value;
        }
      });

      return flattened;
    },
    setData: (data: Partial<ConcentrationDiffusionLBMData>) => {
      Object.keys(data).forEach((key) => {
        const typedKey = key as keyof ConcentrationDiffusionLBMData;
        const value = data[typedKey];
        if (value !== undefined) {
          setValue(typedKey, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: false
          });
        }
      });
    },
  }));

  const getFormErrorMessage = (fieldName: keyof ConcentrationDiffusionLBMData) => {
    const message = errors[fieldName]?.message;
    return <small className="p-error">{message || "\u00A0"}</small>;
  };

  return (
    <form className="p-fluid">
      {/* Initial Conditions Section */}
      {visible && (!activeSection || activeSection === 'initialConditions') && (
        <div className="section-content">
          {/* Initial Pressure */}
          <div className="field compact-field">
            <label
              htmlFor="initialPressure"
              className={classNames({ "p-error": errors.initialPressure })}
            >
              Pressure
            </label>
            <Controller
              name="initialPressure"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter initial pressure"
                  />
                  <span className="p-inputgroup-addon compact-addon">Pa</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialPressure")}
          </div>

          {/* Initial Velocity X */}
          <div className="field compact-field">
            <label
              htmlFor="initialVelocityX"
              className={classNames({ "p-error": errors.initialVelocityX })}
            >
              Velocity X
            </label>
            <Controller
              name="initialVelocityX"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter initial velocity X"
                  />
                  <span className="p-inputgroup-addon compact-addon">m/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialVelocityX")}
          </div>

          {/* Initial Velocity Y */}
          <div className="field compact-field">
            <label
              htmlFor="initialVelocityY"
              className={classNames({ "p-error": errors.initialVelocityY })}
            >
              Velocity Y
            </label>
            <Controller
              name="initialVelocityY"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter initial velocity Y"
                  />
                  <span className="p-inputgroup-addon compact-addon">m/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialVelocityY")}
          </div>

          {/* Initial Velocity Z */}
          <div className="field compact-field">
            <label
              htmlFor="initialVelocityZ"
              className={classNames({ "p-error": errors.initialVelocityZ })}
            >
              Velocity Z
            </label>
            <Controller
              name="initialVelocityZ"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter initial velocity Z"
                  />
                  <span className="p-inputgroup-addon compact-addon">m/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialVelocityZ")}
          </div>

          {/* Initial Concentration Point X */}
          <div className="field compact-field">
            <label
              htmlFor="initialConcentrationPointX"
              className={classNames({ "p-error": errors.initialConcentrationPointX })}
            >
              Concentration Point X
            </label>
            <Controller
              name="initialConcentrationPointX"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter concentration point X"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialConcentrationPointX")}
          </div>

          {/* Initial Concentration Point Y */}
          <div className="field compact-field">
            <label
              htmlFor="initialConcentrationPointY"
              className={classNames({ "p-error": errors.initialConcentrationPointY })}
            >
              Concentration Point Y
            </label>
            <Controller
              name="initialConcentrationPointY"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter concentration point Y"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialConcentrationPointY")}
          </div>

          {/* Initial Concentration Point Z */}
          <div className="field compact-field">
            <label
              htmlFor="initialConcentrationPointZ"
              className={classNames({ "p-error": errors.initialConcentrationPointZ })}
            >
              Concentration Point Z
            </label>
            <Controller
              name="initialConcentrationPointZ"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter concentration point Z"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialConcentrationPointZ")}
          </div>

          {/* Initial Concentration Width */}
          <div className="field compact-field">
            <label
              htmlFor="initialConcentrationWidth"
              className={classNames({ "p-error": errors.initialConcentrationWidth })}
            >
              Concentration Width
            </label>
            <Controller
              name="initialConcentrationWidth"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter concentration width"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("initialConcentrationWidth")}
          </div>
        </div>
      )}

      {/* Materials Section */}
      {visible && (!activeSection || activeSection === 'materials') && (
        <div className="section-content">
          {/* Density */}
          <div className="field compact-field">
            <label
              htmlFor="density"
              className={classNames({ "p-error": errors.density })}
            >
              Density
            </label>
            <Controller
              name="density"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Density must be positive" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    min={0}
                    placeholder="Enter density"
                  />
                  <span className="p-inputgroup-addon compact-addon">kg/m³</span>
                </div>
              )}
            />
            {getFormErrorMessage("density")}
          </div>

          {/* Kinematic Viscosity */}
          <div className="field compact-field">
            <label
              htmlFor="kinematicViscosity"
              className={classNames({ "p-error": errors.kinematicViscosity })}
            >
              Kinematic Viscosity
            </label>
            <Controller
              name="kinematicViscosity"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Kinematic viscosity must be positive" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={15}
                    min={0}
                    placeholder="Enter kinematic viscosity"
                  />
                  <span className="p-inputgroup-addon compact-addon">m²/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("kinematicViscosity")}
          </div>

          {/* Diffusivity 1 */}
          <div className="field compact-field">
            <label
              htmlFor="diffusivity1"
              className={classNames({ "p-error": errors.diffusivity1 })}
            >
              Diffusivity 1
            </label>
            <Controller
              name="diffusivity1"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Diffusivity must be positive" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={15}
                    min={0}
                    placeholder="Enter diffusivity 1"
                  />
                  <span className="p-inputgroup-addon compact-addon">m²/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("diffusivity1")}
          </div>

          {/* Diffusivity 2 */}
          <div className="field compact-field">
            <label
              htmlFor="diffusivity2"
              className={classNames({ "p-error": errors.diffusivity2 })}
            >
              Diffusivity 2
            </label>
            <Controller
              name="diffusivity2"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Diffusivity must be positive" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={15}
                    min={0}
                    placeholder="Enter diffusivity 2"
                  />
                  <span className="p-inputgroup-addon compact-addon">m²/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("diffusivity2")}
          </div>

          {/* Diffusivity 3 */}
          <div className="field compact-field">
            <label
              htmlFor="diffusivity3"
              className={classNames({ "p-error": errors.diffusivity3 })}
            >
              Diffusivity 3
            </label>
            <Controller
              name="diffusivity3"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Diffusivity must be positive" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={15}
                    min={0}
                    placeholder="Enter diffusivity 3"
                  />
                  <span className="p-inputgroup-addon compact-addon">m²/s</span>
                </div>
              )}
            />
            {getFormErrorMessage("diffusivity3")}
          </div>
        </div>
      )}

      {/* Lattice Generation Section */}
      {visible && (!activeSection || activeSection === 'latticeGeneration') && (
        <div className="section-content">
          {/* Domain Min X */}
          <div className="field compact-field">
            <label
              htmlFor="domainMinX"
              className={classNames({ "p-error": errors.domainMinX })}
            >
              Domain Min X
            </label>
            <Controller
              name="domainMinX"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain min X"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMinX")}
          </div>

          {/* Domain Min Y */}
          <div className="field compact-field">
            <label
              htmlFor="domainMinY"
              className={classNames({ "p-error": errors.domainMinY })}
            >
              Domain Min Y
            </label>
            <Controller
              name="domainMinY"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain min Y"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMinY")}
          </div>

          {/* Domain Min Z */}
          <div className="field compact-field">
            <label
              htmlFor="domainMinZ"
              className={classNames({ "p-error": errors.domainMinZ })}
            >
              Domain Min Z
            </label>
            <Controller
              name="domainMinZ"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain min Z"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMinZ")}
          </div>

          {/* Domain Max X */}
          <div className="field compact-field">
            <label
              htmlFor="domainMaxX"
              className={classNames({ "p-error": errors.domainMaxX })}
            >
              Domain Max X
            </label>
            <Controller
              name="domainMaxX"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain max X"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMaxX")}
          </div>

          {/* Domain Max Y */}
          <div className="field compact-field">
            <label
              htmlFor="domainMaxY"
              className={classNames({ "p-error": errors.domainMaxY })}
            >
              Domain Max Y
            </label>
            <Controller
              name="domainMaxY"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain max Y"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMaxY")}
          </div>

          {/* Domain Max Z */}
          <div className="field compact-field">
            <label
              htmlFor="domainMaxZ"
              className={classNames({ "p-error": errors.domainMaxZ })}
            >
              Domain Max Z
            </label>
            <Controller
              name="domainMaxZ"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    maxFractionDigits={10}
                    placeholder="Enter domain max Z"
                  />
                  <span className="p-inputgroup-addon compact-addon">m</span>
                </div>
              )}
            />
            {getFormErrorMessage("domainMaxZ")}
          </div>
        </div>
      )}

      {/* Calculation Section */}
      {visible && (!activeSection || activeSection === 'calculation') && (
        <div className="section-content">
          <div className="field compact-field">
            <label
              htmlFor="endTime"
              className={classNames({ "p-error": errors.endTime })}
            >
              Simulation End Time
            </label>
            <Controller
              name="endTime"
              control={control}
              rules={{
                required: true,
                min: { value: 0, message: "Minimum end time is 0" },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    min={0}
                    maxFractionDigits={10}
                    placeholder="Enter end time"
                  />
                  <span className="p-inputgroup-addon compact-addon">
                    s
                  </span>
                </div>
              )}
            />
            {getFormErrorMessage("endTime")}
          </div>

          <div className="field compact-field">
            <label
              htmlFor="timeStep"
              className={classNames({ "p-error": errors.timeStep })}
            >
              Time Step
            </label>
            <Controller
              name="timeStep"
              control={control}
              rules={{
                required: true,
                min: {
                  value: 0,
                  message: "Minimum time step is 0",
                },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    min={0}
                    maxFractionDigits={10}
                    placeholder="Enter time step"
                  />
                  <span className="p-inputgroup-addon compact-addon">
                    s
                  </span>
                </div>
              )}
            />
            {getFormErrorMessage("timeStep")}
          </div>

          <div className="field compact-field">
            <label
              htmlFor="saveInterval"
              className={classNames({ "p-error": errors.saveInterval })}
            >
              Save Time Interval
            </label>
            <Controller
              name="saveInterval"
              control={control}
              rules={{
                required: true,
                min: {
                  value: 0,
                  message: "Minimum save interval is 0",
                },
              }}
              render={({ field, fieldState }) => (
                <div className="p-inputgroup">
                  <InputNumber
                    id={field.name}
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    className={classNames({ "p-invalid": fieldState.error, "compact-input-number": true })}
                    min={0}
                    maxFractionDigits={10}
                    placeholder="Enter save interval"
                  />
                  <span className="p-inputgroup-addon compact-addon">
                    s
                  </span>
                </div>
              )}
            />
            {getFormErrorMessage("saveInterval")}
          </div>
        </div>
      )}
    </form>
  );
});

ConcentrationDiffusionLBM.displayName = "ConcentrationDiffusionLBM";

export default ConcentrationDiffusionLBM;
