/**
 * OpenFOAM Case Generator
 * Generates OpenFOAM case files based on simulation parameters
 */

export interface OpenFOAMCase {
  files: {
    path: string;
    content: string;
  }[];
}

/**
 * Generate OpenFOAM case files for different simulations
 */
export function generateOpenFOAMCase(
  simulationType: string,
  formData: any
): OpenFOAMCase {
  switch (simulationType) {
    case 'lid_driven_cavity':
      return generateLidDrivenCavityCase(formData);
    case 'laminar_pipe':
      return generateLaminarPipeCase(formData);
    case 'backward_step':
      return generateBackwardStepCase(formData);
    case 'flat_plate_boundary':
      return generateFlatPlateCase(formData);
    case 'natural_convection':
      return generateNaturalConvectionCase(formData);
    case 'dam_break':
      return generateDamBreakCase(formData);
    case 'automotive_aerodynamics':
      return generateAutomotiveAerodynamicsCase(formData);
    default:
      throw new Error(`Unsupported simulation type: ${simulationType}`);
  }
}

/**
 * Lid-Driven Cavity Case Generator
 */
function generateLidDrivenCavityCase(data: any): OpenFOAMCase {
  const files = [];

  // Extract common parameters once for use throughout the function
  const solverType = data.solverType || 'icoFoam';
  const width = data.cavityWidth || 0.1;
  const height = data.cavityHeight || 0.1;
  const depth = data.cavityDepth || 0.1;
  const cellsX = data.cellsX || 20;
  const cellsY = data.cellsY || 20;
  const cellsZ = data.cellsZ || 1;
  const isParallel = data.runInParallel && data.numberOfProcessors > 1;
  const nProcs = data.numberOfProcessors || 4;

  // README.md - Execution guide
  files.push({
    path: 'README.md',
    content: `# Lid-Driven Cavity Flow Case

## Case Description
2D square cavity with moving top lid - classic CFD benchmark problem for validating Navier-Stokes solvers.

## Case Parameters
- Cavity Width: ${data.cavityWidth || 0.1} m
- Cavity Height: ${data.cavityHeight || 0.1} m
- Cavity Depth: ${data.cavityDepth || 0.1} m
- Mesh: ${cellsX} × ${cellsY} × ${cellsZ} cells
- Lid Velocity: ${data.lidVelocity || 1.0} m/s
- Kinematic Viscosity: ${data.kinematicViscosity || 0.01} m²/s
- Reynolds Number: ${data.reynoldsNumber || 100}
- Solver: ${solverType}${solverType === 'pisoFoam' ? ' (Note: Use "foamRun -solver incompressibleFluid" for OpenFOAM v11+)' : ''}
- End Time: ${data.endTime || 20} s
- Time Step: ${data.deltaT || 0.005} s
- Write Option: ${data.writeOption === 'all' ? 'Save all timesteps' : data.writeOption === 'lastOnly' ? 'Save last only' : 'Save at intervals'}${data.writeOption === 'interval' ? ` (${data.writeInterval || 0.1} s)` : ''}
- Parallel: ${isParallel ? `Yes (${nProcs} processors)` : 'No (serial)'}

## Quick Start

### 1. Setup OpenFOAM Environment

**OpenFOAM ESI (v2312, v2406, etc.):**
\`\`\`bash
source /opt/openfoam2312/etc/bashrc
\`\`\`

**OpenFOAM Foundation (10, 11, 12, etc.):**
\`\`\`bash
source /opt/openfoam11/etc/bashrc
# or
source /usr/lib/openfoam/openfoam2406/etc/bashrc
\`\`\`

**Note:** This case is compatible with both OpenFOAM ESI and Foundation versions.

### 2. Run Case
\`\`\`bash
chmod +x Allrun Allclean
./Allrun
\`\`\`

### 3. View Results

**Option A: Windows ParaView (Recommended for WSL)**
\`\`\`bash
# Create .foam file
touch case.foam

# Open in Windows Explorer:
# \\\\wsl$\\Ubuntu\\home\\USERNAME\\myCase\\case.foam
# Double-click to open with ParaView
\`\`\`

**Option B: WSL ParaView (if working)**
\`\`\`bash
paraFoam
\`\`\`

**Option C: Convert to VTK**
\`\`\`bash
foamToVTK
# Open VTK/*.vtk files in Windows ParaView
\`\`\`

## Manual Execution

${isParallel ? `### Parallel Execution (${nProcs} processors)

\`\`\`bash
# Generate mesh
blockMesh

# Check mesh quality
checkMesh

# Decompose domain for parallel processing
decomposePar

# Run solver in parallel
mpirun -np ${nProcs} ${solverType === 'incompressibleFluid' ? 'foamRun -solver incompressibleFluid -parallel' : solverType === 'pisoFoam' ? 'foamRun -solver incompressibleFluid -parallel  # or pisoFoam -parallel' : `${solverType} -parallel`}

# Reconstruct the case
reconstructPar

# View results
paraFoam
\`\`\`

**Note:** Parallel results are stored in \`processor*\` directories. After \`reconstructPar\`, the reconstructed fields are in the time directories.
` : `### Serial Execution

\`\`\`bash
# Generate mesh
blockMesh

# Check mesh quality
checkMesh

# Run solver
${solverType === 'incompressibleFluid' ? 'foamRun -solver incompressibleFluid' : solverType === 'pisoFoam' ? '# OpenFOAM ESI/older versions:\npisoFoam\n# OR OpenFOAM v11+ (pisoFoam is deprecated):\nfoamRun -solver incompressibleFluid' : solverType} > log.solver 2>&1

# View results
paraFoam
\`\`\`
`}

## Solver Compatibility Notes

${solverType === 'pisoFoam' || solverType === 'incompressibleFluid' ? `**IMPORTANT - OpenFOAM v11+ Users:**
- \`pisoFoam\` has been superseded by \`foamRun -solver incompressibleFluid\`
- This case includes both PIMPLE and PISO dictionaries in fvSolution for compatibility
- The PIMPLE algorithm with nOuterCorrectors=1 is equivalent to PISO

**To run on OpenFOAM v11+:**
\`\`\`bash
foamRun -solver incompressibleFluid
\`\`\`

**To run on OpenFOAM ESI (v2312, etc.) or older Foundation versions:**
\`\`\`bash
pisoFoam
\`\`\`
` : ''}

## Clean Case
\`\`\`bash
./Allclean
\`\`\`

## Expected Results
- Primary vortex in cavity center
- Secondary vortices in bottom corners (Re > 100)
- Velocity magnitude decreases from top to bottom
- Benchmark comparison available in literature

## References
- Ghia et al. (1982) - High-Re solutions for incompressible flow
- OpenFOAM cavity tutorial

---
Generated by CFD Preprocessor Web Application
`
  });

  // Allrun - Execution script
  let runSolverCommand: string;

  if (solverType === 'incompressibleFluid') {
    runSolverCommand = 'runApplication foamRun -solver incompressibleFluid';
  } else if (solverType === 'pisoFoam') {
    // Try to detect OpenFOAM version and use appropriate solver
    runSolverCommand = `# Auto-detect OpenFOAM version and use appropriate solver
if command -v foamRun >/dev/null 2>&1 && foamRun -help 2>&1 | grep -q "incompressibleFluid"; then
    echo "Detected OpenFOAM v11+ - using foamRun -solver incompressibleFluid"
    runApplication foamRun -solver incompressibleFluid
else
    echo "Using pisoFoam (older OpenFOAM version)"
    runApplication pisoFoam
fi`;
  } else {
    runSolverCommand = `runApplication ${solverType}`;
  }

  files.push({
    path: 'Allrun',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1    # Run from this directory

# Source tutorial run functions
. $WM_PROJECT_DIR/bin/tools/RunFunctions

# Generate mesh
runApplication blockMesh

# Check mesh
runApplication checkMesh

${isParallel ? `# Decompose mesh for parallel processing
echo "Decomposing mesh for ${nProcs} processors..."
runApplication decomposePar

# Run solver in parallel
echo "Running solver in parallel on ${nProcs} processors..."
${runSolverCommand.includes('runApplication') ?
  runSolverCommand.replace('runApplication', `runParallel -np ${nProcs}`) :
  `runParallel -np ${nProcs} ${solverType}`}

# Reconstruct the case
echo "Reconstructing parallel case..."
runApplication reconstructPar
` : `# Run solver (serial)
${runSolverCommand}
`}
echo ""
echo "Case completed successfully!"
echo "Run 'paraFoam' to view results"
echo ""

#------------------------------------------------------------------------------
`
  });

  // Allclean - Cleanup script
  files.push({
    path: 'Allclean',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1    # Run from this directory

# Source tutorial clean functions
. $WM_PROJECT_DIR/bin/tools/CleanFunctions

# Remove time directories
foamListTimes -rm

# Remove log files
rm -f log.*

# Remove mesh
rm -rf constant/polyMesh

# Remove postProcessing
rm -rf postProcessing

# Remove processor directories (if parallel)
rm -rf processor*

# Remove ParaView files
rm -f *.foam *.OpenFOAM

echo "Case cleaned"

#------------------------------------------------------------------------------
`
  });

  // 0/U - Velocity field
  files.push({
    path: '0/U',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform (0 0 0);

boundaryField
{
    movingWall
    {
        type            fixedValue;
        value           uniform (${data.lidVelocity || 1.0} 0 0);
    }

    fixedWalls
    {
        type            fixedValue;
        value           uniform (0 0 0);
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // 0/p - Pressure field
  files.push({
    path: '0/p',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    movingWall
    {
        type            zeroGradient;
    }

    fixedWalls
    {
        type            zeroGradient;
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // constant/transportProperties (for both ESI and Foundation versions)
  // Generate both files to support different OpenFOAM versions

  // transportProperties (ESI version - v2312, etc.)
  files.push({
    path: 'constant/transportProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

nu              [0 2 -1 0 0 0 0] ${data.kinematicViscosity || 0.01};

// ************************************************************************* //
`
  });

  // physicalProperties (Foundation version - 10, 11, etc.)
  // For incompressibleFluid solver, need to specify viscosityModel
  files.push({
    path: 'constant/physicalProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      physicalProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// Viscosity model for incompressibleFluid solver (OpenFOAM v11+)
viscosityModel  Newtonian;

nu              [0 2 -1 0 0 0 0] ${data.kinematicViscosity || 0.01};

// ************************************************************************* //
`
  });

  // constant/momentumTransport (OpenFOAM v11+ - replaces turbulenceProperties)
  files.push({
    path: 'constant/momentumTransport',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      momentumTransport;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// Laminar simulation (no turbulence model)
simulationType  laminar;

// ************************************************************************* //
`
  });

  // constant/turbulenceProperties (for older versions - ESI, Foundation <11)
  files.push({
    path: 'constant/turbulenceProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      turbulenceProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// Laminar simulation (no turbulence model)
simulationType  laminar;

// ************************************************************************* //
`
  });

  // system/controlDict
  const writeOption = data.writeOption || 'interval';
  let writeControl: string;
  let writeInterval: number | string;

  switch (writeOption) {
    case 'all':
      // Save every timestep
      writeControl = 'timeStep';
      writeInterval = 1;
      break;
    case 'lastOnly':
      // Save only at end
      writeControl = 'endTime';
      writeInterval = 1;
      break;
    case 'interval':
    default:
      // Save at time intervals
      writeControl = 'runTime';
      writeInterval = data.writeInterval || 0.1;
      break;
  }

  // Determine application name for controlDict
  const applicationName = (solverType === 'incompressibleFluid' || solverType === 'pisoFoam')
    ? 'foamRun'  // For v11+ compatibility
    : solverType;

  files.push({
    path: 'system/controlDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     ${applicationName};

startFrom       startTime;

startTime       0;

stopAt          endTime;

endTime         ${data.endTime || 20};

deltaT          ${data.deltaT || 0.0001};

writeControl    ${writeControl};

writeInterval   ${writeInterval};

purgeWrite      0;

writeFormat     ascii;

writePrecision  6;

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable true;

// Adjust time step based on Courant number for stability
adjustTimeStep  yes;

maxCo           0.5;        // Maximum Courant number

maxDeltaT       0.01;       // Maximum time step

// ************************************************************************* //
`
  });

  // system/fvSchemes
  files.push({
    path: 'system/fvSchemes',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         Euler;
}

gradSchemes
{
    default         Gauss linear;
    grad(p)         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear orthogonal;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         orthogonal;
}

// ************************************************************************* //
`
  });

  // system/fvSolution
  // Generate solver-specific configuration
  // - icoFoam: uses PISO algorithm (older versions)
  // - pisoFoam: uses PISO algorithm (deprecated in v11+, replaced by incompressibleFluid)
  // - incompressibleFluid: uses PIMPLE algorithm (OpenFOAM v11+)
  files.push({
    path: 'system/fvSolution',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-06;
        relTol          0.05;
    }

    pFinal
    {
        $p;
        relTol          0;
    }

    U
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-05;
        relTol          0;
    }

    UFinal
    {
        $U;
    }
}

${solverType === 'icoFoam' ? `PISO
{
    nCorrectors     2;
    nNonOrthogonalCorrectors 0;
    pRefCell        0;
    pRefValue       0;
}` : `PIMPLE
{
    nOuterCorrectors 1;
    nCorrectors     2;
    nNonOrthogonalCorrectors 0;
    pRefCell        0;
    pRefValue       0;
}

// PISO settings (backward compatibility)
PISO
{
    nCorrectors     2;
    nNonOrthogonalCorrectors 0;
    pRefCell        0;
    pRefValue       0;
}`}

// ************************************************************************* //
`
  });

  // system/decomposeParDict (for parallel processing)
  if (data.runInParallel && data.numberOfProcessors > 1) {
    const nProcs = data.numberOfProcessors || 4;

    // Calculate decomposition in x and y directions
    // For 2D cases (cellsZ = 1), decompose only in x-y plane
    let nx = 1, ny = 1, nz = 1;

    // Simple decomposition strategy
    if (nProcs === 2) {
      nx = 2; ny = 1; nz = 1;
    } else if (nProcs === 4) {
      nx = 2; ny = 2; nz = 1;
    } else if (nProcs === 8) {
      nx = 4; ny = 2; nz = 1;
    } else if (nProcs === 16) {
      nx = 4; ny = 4; nz = 1;
    } else {
      // For other numbers, use scotch method (automatic)
      nx = nProcs; ny = 1; nz = 1;
    }

    files.push({
      path: 'system/decomposeParDict',
      content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains ${nProcs};

${nProcs === 2 || nProcs === 4 || nProcs === 8 || nProcs === 16 ? `method          simple;

simpleCoeffs
{
    n               (${nx} ${ny} ${nz});
    delta           0.001;
}` : `method          scotch;

scotchCoeffs
{
    // Default coefficients
}`}

// ************************************************************************* //
`
    });
  }

  // system/blockMeshDict
  files.push({
    path: 'system/blockMeshDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

scale   1;

vertices
(
    (0 0 0)
    (${width} 0 0)
    (${width} ${height} 0)
    (0 ${height} 0)
    (0 0 ${depth})
    (${width} 0 ${depth})
    (${width} ${height} ${depth})
    (0 ${height} ${depth})
);

blocks
(
    hex (0 1 2 3 4 5 6 7) (${cellsX} ${cellsY} ${cellsZ}) simpleGrading (1 1 1)
);

edges
(
);

boundary
(
    movingWall
    {
        type wall;
        faces
        (
            (3 7 6 2)
        );
    }
    fixedWalls
    {
        type wall;
        faces
        (
            (0 4 7 3)
            (2 6 5 1)
            (1 5 4 0)
        );
    }
    frontAndBack
    {
        type empty;
        faces
        (
            (0 3 2 1)
            (4 5 6 7)
        );
    }
);

mergePatchPairs
(
);

// ************************************************************************* //
`
  });

  return { files };
}

/**
 * Placeholder generators for other simulations
 * TODO: Implement full case generation for each simulation
 */
function generateLaminarPipeCase(data: any): OpenFOAMCase {
  const files = [];

  // Extract parameters
  const solverType = data.solverType || 'simpleFoam';
  const isTransient = solverType === 'icoFoam' || solverType === 'pisoFoam';

  // Geometry parameters - rectangular pipe only
  const pipeWidth = data.pipeWidth || 0.05;
  const pipeHeight = data.pipeHeight || 0.05;
  const pipeLength = data.pipeLength || 1.0;
  const hydraulicDiameter = data.hydraulicDiameter || (2 * pipeWidth * pipeHeight) / (pipeWidth + pipeHeight);

  // Flow parameters
  const inletVelocity = data.inletVelocity || 0.1;
  const inletPressure = data.inletPressure || 0;
  const density = data.density || 1000;
  const dynamicViscosity = data.dynamicViscosity || 0.001;
  const kinematicViscosity = dynamicViscosity / density;
  const reynoldsNumber = data.reynoldsNumber || (density * inletVelocity * hydraulicDiameter) / dynamicViscosity;
  const pressureDrop = data.pressureDrop || 0;

  // Time controls
  const endTime = data.endTime || 100;
  const deltaT = data.deltaT || 0.01;
  const writeInterval = data.writeInterval || 1;

  // Mesh parameters (from user input)
  const cellsAxial = data.cellsAxial || 100;
  const cellsRadial = data.cellsRadial || 10;
  const cellsCircumferential = data.cellsCircumferential || 20;

  // Parallel processing
  const runInParallel = data.runInParallel || false;
  const numberOfProcessors = data.numberOfProcessors || 4;

  // Calculate write interval value
  // For steady-state (simpleFoam), convert seconds to iteration count
  const writeIntervalValue = isTransient
    ? writeInterval
    : Math.max(1, Math.round(writeInterval / deltaT));

  // README.md
  files.push({
    path: 'README.md',
    content: `# Laminar Pipe Flow Case

## Case Description
Rectangular duct flow - validation case for laminar flow development and Hagen-Poiseuille law.

## Case Parameters
- Pipe Geometry: Rectangular
- Pipe Width: ${pipeWidth} m
- Pipe Height: ${pipeHeight} m
- Pipe Length: ${pipeLength} m
- Hydraulic Diameter: ${hydraulicDiameter.toFixed(6)} m
- Mesh: ${cellsAxial} × ${cellsRadial} × ${cellsCircumferential} cells (Axial × Height × Width)
- Total Cells: ${cellsAxial * cellsRadial * cellsCircumferential}
- Inlet Velocity: ${inletVelocity} m/s
- Density: ${density} kg/m³
- Dynamic Viscosity: ${dynamicViscosity} Pa·s
- Kinematic Viscosity: ${kinematicViscosity.toFixed(8)} m²/s
- Reynolds Number: ${reynoldsNumber.toFixed(2)}
- Theoretical Pressure Drop: ${pressureDrop.toFixed(2)} Pa
- Solver: ${solverType} (${isTransient ? 'Transient' : 'Steady-state'})
- End Time: ${endTime} ${isTransient ? 's' : 'iterations'}
- Time Step: ${deltaT} s
- Write Interval: ${writeInterval} s${isTransient ? '' : ` (= ${writeIntervalValue} iterations)`}
- Parallel Processing: ${runInParallel ? `Enabled (${numberOfProcessors} cores)` : 'Disabled (serial)'}

## Flow Regime
${reynoldsNumber < 2300 ? '✓ Laminar Flow (Re < 2300)' : reynoldsNumber < 4000 ? '⚠️ Transitional Flow (2300 ≤ Re < 4000)' : '❌ Turbulent Flow (Re ≥ 4000)'}

## Quick Start

### 1. Setup OpenFOAM Environment
\`\`\`bash
source /opt/openfoam11/etc/bashrc
# or
source /opt/openfoam2312/etc/bashrc
\`\`\`

### 2. Run Case
\`\`\`bash
chmod +x Allrun Allclean
./Allrun
\`\`\`

### 3. View Results
\`\`\`bash
# Create .foam file
touch case.foam
# Open with ParaView
\`\`\`

## Expected Results
- Parabolic velocity profile (fully developed)
- Maximum velocity at duct center
- Pressure drops linearly along pipe length
- Hagen-Poiseuille law: ΔP = 32 μ L U / Dh²
- Entry length L_e ≈ 0.05 Re × Dh = ${(0.05 * reynoldsNumber * hydraulicDiameter).toFixed(3)} m

## Clean Case
\`\`\`bash
./Allclean
\`\`\`

---
Generated by CFD Preprocessor Web Application
`
  });

  // Allrun - with parallel processing support
  const runSolverCommand = solverType === 'simpleFoam' || solverType === 'icoFoam'
    ? `runApplication ${solverType}`
    : `runApplication foamRun -solver incompressibleFluid`;

  files.push({
    path: 'Allrun',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1

. $WM_PROJECT_DIR/bin/tools/RunFunctions

# Generate mesh
runApplication blockMesh

# Check mesh
runApplication checkMesh

${runInParallel ? `# Decompose mesh for parallel processing
echo "Decomposing mesh for ${numberOfProcessors} processors..."
runApplication decomposePar

# Run solver in parallel
echo "Running solver in parallel on ${numberOfProcessors} processors..."
${runSolverCommand.includes('runApplication') ?
  runSolverCommand.replace('runApplication', `runParallel -np ${numberOfProcessors}`) :
  `runParallel -np ${numberOfProcessors} ${solverType}`}

# Reconstruct the case
echo "Reconstructing parallel case..."
runApplication reconstructPar
` : `# Run solver (serial)
${runSolverCommand}
`}
echo ""
echo "Case completed successfully!"
echo "Run 'paraFoam' to view results"
echo ""

#------------------------------------------------------------------------------
`
  });

  // Allclean
  files.push({
    path: 'Allclean',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1

. $WM_PROJECT_DIR/bin/tools/CleanFunctions

foamListTimes -rm
rm -f log.*
rm -rf constant/polyMesh
rm -rf postProcessing
rm -f *.foam *.OpenFOAM

${runInParallel ? `# Clean parallel directories
for i in processor*
do
    if [ -d "$i" ]; then
        rm -rf "$i"
    fi
done
` : ''}
echo "Case cleaned"

#------------------------------------------------------------------------------
`
  });

  // 0/U - Velocity boundary conditions
  files.push({
    path: '0/U',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform (${inletVelocity} 0 0);

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform (${inletVelocity} 0 0);
    }

    outlet
    {
        type            zeroGradient;
    }

    walls
    {
        type            noSlip;
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // 0/p - Pressure boundary conditions
  files.push({
    path: '0/p',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform ${inletPressure};

boundaryField
{
    inlet
    {
        type            zeroGradient;
    }

    outlet
    {
        type            fixedValue;
        value           uniform 0;
    }

    walls
    {
        type            zeroGradient;
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // constant/physicalProperties (OpenFOAM v11+) AND transportProperties (older versions)
  files.push({
    path: 'constant/physicalProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      physicalProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

viscosityModel  Newtonian;

nu              [0 2 -1 0 0 0 0] ${kinematicViscosity.toFixed(8)};

// ************************************************************************* //
`
  });

  files.push({
    path: 'constant/transportProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

nu              [0 2 -1 0 0 0 0] ${kinematicViscosity.toFixed(8)};

// ************************************************************************* //
`
  });

  // constant/momentumTransport (v11+) AND turbulenceProperties (older)
  files.push({
    path: 'constant/momentumTransport',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      momentumTransport;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  laminar;

// ************************************************************************* //
`
  });

  files.push({
    path: 'constant/turbulenceProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      turbulenceProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  laminar;

// ************************************************************************* //
`
  });

  // system/controlDict
  files.push({
    path: 'system/controlDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     ${solverType === 'simpleFoam' || solverType === 'icoFoam' ? solverType : 'foamRun'};

startFrom       startTime;

startTime       0;

stopAt          endTime;

endTime         ${endTime};

deltaT          ${deltaT};

writeControl    ${isTransient ? 'runTime' : 'timeStep'};

// ${isTransient ? 'writeInterval in seconds' : `writeInterval in iterations (user input ${writeInterval}s / deltaT ${deltaT}s = ${writeIntervalValue} iterations)`}
writeInterval   ${writeIntervalValue};

purgeWrite      0;

writeFormat     ascii;

writePrecision  6;

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable true;

${isTransient ? `// Transient solver settings
adjustTimeStep  no;

maxCo           0.5;
` : `// Steady-state solver settings
// simpleFoam does not use adjustTimeStep
`}
// ************************************************************************* //
`
  });

  // system/fvSchemes
  files.push({
    path: 'system/fvSchemes',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         ${isTransient ? 'Euler' : 'steadyState'};
}

gradSchemes
{
    default         Gauss linear;
    grad(p)         Gauss linear;
    grad(U)         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      Gauss linear;
    div((nuEff*dev2(T(grad(U))))) Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear orthogonal;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         orthogonal;
}

// ************************************************************************* //
`
  });

  // system/fvSolution
  files.push({
    path: 'system/fvSolution',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-08;
        relTol          0.01;
        maxIter         1000;
    }

    pFinal
    {
        \$p;
        relTol          0;
    }

    U
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-06;
        relTol          0.01;
    }

    UFinal
    {
        \$U;
        relTol          0;
    }
}

${isTransient ? `PISO
{
    nCorrectors     2;
    nNonOrthogonalCorrectors 2;
}` : `SIMPLE
{
    nNonOrthogonalCorrectors 2;
    consistent      yes;

    residualControl
    {
        p               1e-4;
        U               1e-4;
    }
}

relaxationFactors
{
    fields
    {
        p               0.3;
    }
    equations
    {
        U               0.7;
    }
}`}

// ************************************************************************* //
`
  });

  // system/blockMeshDict - Rectangular duct mesh
  console.log(`[OpenFOAM] Rectangular pipe mesh coordinates:
  Width: ${pipeWidth}m, Height: ${pipeHeight}m, Length: ${pipeLength}m
  Mesh extent: X=[0, ${pipeLength}], Y=[0, ${pipeWidth}], Z=[0, ${pipeHeight}]`);

  files.push({
    path: 'system/blockMeshDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// Rectangular duct
// Width: ${pipeWidth} m, Height: ${pipeHeight} m, Length: ${pipeLength} m

convertToMeters 1;

vertices
(
    // Inlet face (x=0)
    (0 0 0)                          // 0
    (0 ${pipeWidth} 0)               // 1
    (0 ${pipeWidth} ${pipeHeight})   // 2
    (0 0 ${pipeHeight})              // 3

    // Outlet face (x=L)
    (${pipeLength} 0 0)              // 4
    (${pipeLength} ${pipeWidth} 0)   // 5
    (${pipeLength} ${pipeWidth} ${pipeHeight})  // 6
    (${pipeLength} 0 ${pipeHeight})  // 7
);

blocks
(
    hex (0 1 2 3 4 5 6 7) (${cellsAxial} ${cellsCircumferential} ${cellsRadial}) simpleGrading (1 1 1)
);

edges
(
);

boundary
(
    inlet
    {
        type patch;
        faces
        (
            (0 3 2 1)
        );
    }

    outlet
    {
        type patch;
        faces
        (
            (4 5 6 7)
        );
    }

    walls
    {
        type wall;
        faces
        (
            (0 4 7 3)   // bottom
            (2 6 5 1)   // top
            (1 5 4 0)   // front
            (3 7 6 2)   // back
        );
    }
);

mergePatchPairs
(
);

// ************************************************************************* //
`
  });

  // system/decomposeParDict - for parallel processing
  if (runInParallel) {
    // Determine decomposition method based on number of processors
    const isPowerOf2 = (numberOfProcessors & (numberOfProcessors - 1)) === 0;
    const method = isPowerOf2 ? 'simple' : 'scotch';

    let simpleCoeffs = '';
    if (method === 'simple') {
      // Calculate optimal distribution for simple method
      const n = numberOfProcessors;
      let nx, ny, nz;

      // Rectangular duct: can decompose in multiple directions
      if (n === 2) {
        nx = 2; ny = 1; nz = 1;
      } else if (n === 4) {
        nx = 2; ny = 2; nz = 1;
      } else if (n === 8) {
        nx = 4; ny = 2; nz = 1;
      } else if (n === 16) {
        nx = 8; ny = 2; nz = 1;
      } else {
        // Default distribution
        nx = Math.ceil(Math.pow(n, 1/3));
        ny = Math.ceil(Math.sqrt(n / nx));
        nz = Math.ceil(n / (nx * ny));
      }

      simpleCoeffs = `
simpleCoeffs
{
    n               (${nx} ${ny} ${nz});
    delta           0.001;
}`;
    }

    files.push({
      path: 'system/decomposeParDict',
      content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains ${numberOfProcessors};

method          ${method};
${simpleCoeffs}
// ************************************************************************* //
`
    });
  }

  return { files };
}

function generateBackwardStepCase(_data: any): OpenFOAMCase {
  return {
    files: [
      {
        path: 'README.txt',
        content: 'Backward-Facing Step case - Implementation in progress'
      }
    ]
  };
}

function generateFlatPlateCase(_data: any): OpenFOAMCase {
  return {
    files: [
      {
        path: 'README.txt',
        content: 'Flat Plate Boundary Layer case - Implementation in progress'
      }
    ]
  };
}

function generateNaturalConvectionCase(_data: any): OpenFOAMCase {
  return {
    files: [
      {
        path: 'README.txt',
        content: 'Natural Convection case - Implementation in progress'
      }
    ]
  };
}

/**
 * Generate Dam Break Case (interFoam - Multiphase VOF)
 */
function generateDamBreakCase(data: any): OpenFOAMCase {
  const files = [];

  // Extract parameters
  const waterColumnHeight = data.waterColumnHeight || 0.6;
  const waterColumnWidth = data.waterColumnWidth || 0.146;
  const domainLength = data.domainLength || 0.584;
  const domainHeight = data.domainHeight || 0.4;
  const waterDensity = data.waterDensity || 1000;
  const waterViscosity = data.waterViscosity || 0.001;
  const airDensity = data.airDensity || 1;
  const airViscosity = data.airViscosity || 1.48e-5;
  const gravity = data.gravity || 9.81;
  const surfaceTension = data.surfaceTension || 0.07;
  const courantNumber = data.courantNumber || 0.5;
  const maxDeltaT = data.maxDeltaT || 0.001;
  const endTime = data.endTime || 1.0;
  const deltaT = data.deltaT || 0.0001;
  const writeInterval = data.writeInterval || 0.05;
  const solverType = data.solverType || 'interFoam';
  const runInParallel = data.runInParallel || false;
  const numberOfProcessors = data.numberOfProcessors || 4;

  // Calculate mesh cells (2D simulation - depth = 1 cell)
  const cellsX = Math.max(50, Math.round(domainLength / 0.01));  // ~1cm cells
  const cellsY = Math.max(40, Math.round(domainHeight / 0.01));
  const domainDepth = 0.01;  // 2D simulation depth

  // README.md
  files.push({
    path: 'README.md',
    content: `# Dam Break Case

## Case Description
2D Dam Break simulation using Volume of Fluid (VOF) method with ${solverType} solver.
Classic validation case for multiphase flow simulations.

## Case Parameters
- Water Column: ${waterColumnWidth} m × ${waterColumnHeight} m (Width × Height)
- Domain: ${domainLength} m × ${domainHeight} m × ${domainDepth} m (2D)
- Mesh: ${cellsX} × ${cellsY} × 1 cells
- Total Cells: ${cellsX * cellsY}

### Water Properties
- Density: ${waterDensity} kg/m³
- Dynamic Viscosity: ${waterViscosity} Pa·s

### Air Properties
- Density: ${airDensity} kg/m³
- Dynamic Viscosity: ${airViscosity} Pa·s

### Interface
- Surface Tension: ${surfaceTension} N/m

### Simulation Settings
- Gravity: ${gravity} m/s²
- Solver: ${solverType}
- Max Courant Number: ${courantNumber}
- Max Time Step: ${maxDeltaT} s
- Initial Time Step: ${deltaT} s
- End Time: ${endTime} s
- Write Interval: ${writeInterval} s
- Parallel: ${runInParallel ? `Yes (${numberOfProcessors} cores)` : 'No (serial)'}

## Quick Start

### 1. Setup OpenFOAM Environment
\`\`\`bash
source /opt/openfoam11/etc/bashrc
# or
source /opt/openfoam2312/etc/bashrc
\`\`\`

### 2. Run Case
\`\`\`bash
chmod +x Allrun Allclean
./Allrun
\`\`\`

### 3. View Results
\`\`\`bash
# Create .foam file
touch case.foam
# Open with ParaView
paraFoam
\`\`\`

## Expected Results
- Water column collapses under gravity
- Water flows along the bottom
- Free surface evolution (wave formation)
- Air-water interface tracking via VOF

## Clean Case
\`\`\`bash
./Allclean
\`\`\`

---
Generated by CFD Preprocessor Web Application
`
  });

  // Allrun script
  files.push({
    path: 'Allrun',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1

. $WM_PROJECT_DIR/bin/tools/RunFunctions

# Generate mesh
runApplication blockMesh

# Set initial water/air distribution
runApplication setFields

${runInParallel ? `# Decompose mesh for parallel processing
echo "Decomposing mesh for ${numberOfProcessors} processors..."
runApplication decomposePar

# Run solver in parallel (OpenFOAM 11+ uses foamRun)
echo "Running incompressibleVoF solver in parallel on ${numberOfProcessors} processors..."
runParallel foamRun -solver incompressibleVoF

# Reconstruct the case
echo "Reconstructing parallel case..."
runApplication reconstructPar
` : `# Run solver (serial) - OpenFOAM 11+ uses foamRun
echo "Running incompressibleVoF solver..."
runApplication foamRun -solver incompressibleVoF
`}
echo ""
echo "Case completed successfully!"
echo "Run 'paraFoam' to view results"
echo ""

#------------------------------------------------------------------------------
`
  });

  // Allclean script
  files.push({
    path: 'Allclean',
    content: `#!/bin/sh
cd "\${0%/*}" || exit 1

. $WM_PROJECT_DIR/bin/tools/CleanFunctions

foamListTimes -rm
rm -f log.*
rm -rf constant/polyMesh
rm -rf postProcessing
rm -f *.foam *.OpenFOAM

${runInParallel ? `# Clean parallel directories
for i in processor*
do
    if [ -d "$i" ]; then
        rm -rf "$i"
    fi
done
` : ''}
echo "Case cleaned"

#------------------------------------------------------------------------------
`
  });

  // system/controlDict
  files.push({
    path: 'system/controlDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     ${solverType};

startFrom       startTime;

startTime       0;

stopAt          endTime;

endTime         ${endTime};

deltaT          ${deltaT};

writeControl    adjustableRunTime;

writeInterval   ${writeInterval};

purgeWrite      0;

writeFormat     ascii;

writePrecision  6;

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable yes;

adjustTimeStep  yes;

maxCo           ${courantNumber};

maxAlphaCo      ${courantNumber};

maxDeltaT       ${maxDeltaT};

// ************************************************************************* //
`
  });

  // system/fvSchemes
  files.push({
    path: 'system/fvSchemes',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         Euler;
}

gradSchemes
{
    default         Gauss linear;
}

divSchemes
{
    div(rhoPhi,U)   Gauss linearUpwind grad(U);
    div(phi,alpha)  Gauss vanLeer;
    div(phirb,alpha) Gauss linear;
    div(((rho*nuEff)*dev2(T(grad(U))))) Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear corrected;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         corrected;
}

// ************************************************************************* //
`
  });

  // system/fvSolution
  files.push({
    path: 'system/fvSolution',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    "alpha.water.*"
    {
        nAlphaCorr      2;
        nAlphaSubCycles 1;
        cAlpha          1;

        MULESCorr       yes;
        nLimiterIter    3;

        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-8;
        relTol          0;
    }

    "pcorr.*"
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-5;
        relTol          0;
    }

    p_rgh
    {
        solver          PCG;
        preconditioner  DIC;
        tolerance       1e-07;
        relTol          0.05;
    }

    p_rghFinal
    {
        $p_rgh;
        relTol          0;
    }

    U
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-06;
        relTol          0;
    }
}

PIMPLE
{
    momentumPredictor   no;
    nOuterCorrectors    1;
    nCorrectors         3;
    nNonOrthogonalCorrectors 0;
}

relaxationFactors
{
    equations
    {
        ".*" 1;
    }
}

// ************************************************************************* //
`
  });

  // system/blockMeshDict
  files.push({
    path: 'system/blockMeshDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

// 2D Dam Break domain
// X: 0 to ${domainLength} (horizontal)
// Y: 0 to ${domainHeight} (vertical)
// Z: 0 to ${domainDepth} (depth - single cell for 2D)

convertToMeters 1;

vertices
(
    (0 0 0)                             // 0
    (${domainLength} 0 0)               // 1
    (${domainLength} ${domainHeight} 0) // 2
    (0 ${domainHeight} 0)               // 3
    (0 0 ${domainDepth})                // 4
    (${domainLength} 0 ${domainDepth})  // 5
    (${domainLength} ${domainHeight} ${domainDepth}) // 6
    (0 ${domainHeight} ${domainDepth})  // 7
);

blocks
(
    hex (0 1 2 3 4 5 6 7) (${cellsX} ${cellsY} 1) simpleGrading (1 1 1)
);

edges
(
);

boundary
(
    leftWall
    {
        type wall;
        faces
        (
            (0 4 7 3)
        );
    }

    rightWall
    {
        type wall;
        faces
        (
            (1 2 6 5)
        );
    }

    lowerWall
    {
        type wall;
        faces
        (
            (0 1 5 4)
        );
    }

    atmosphere
    {
        type patch;
        faces
        (
            (3 7 6 2)
        );
    }

    frontAndBack
    {
        type empty;
        faces
        (
            (0 3 2 1)
            (4 5 6 7)
        );
    }
);

mergePatchPairs
(
);

// ************************************************************************* //
`
  });

  // system/setFieldsDict
  files.push({
    path: 'system/setFieldsDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      setFieldsDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

defaultFieldValues
(
    volScalarFieldValue alpha.water 0
);

regions
(
    boxToCell
    {
        box (0 0 0) (${waterColumnWidth} ${waterColumnHeight} ${domainDepth});
        fieldValues
        (
            volScalarFieldValue alpha.water 1
        );
    }
);

// ************************************************************************* //
`
  });

  // constant/phaseProperties (OpenFOAM 11+ format)
  files.push({
    path: 'constant/phaseProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      phaseProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

type    incompressibleTwoPhaseSystem;

phases  (water air);

water
{
    type            pureIsothermalPhaseModel;
    diameterModel   none;
    residualAlpha   1e-6;
}

air
{
    type            pureIsothermalPhaseModel;
    diameterModel   none;
    residualAlpha   1e-6;
}

sigma           ${surfaceTension};

// ************************************************************************* //
`
  });

  // constant/physicalProperties.water (OpenFOAM 11+ format)
  files.push({
    path: 'constant/physicalProperties.water',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      physicalProperties.water;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

viscosityModel  Newtonian;

rho             ${waterDensity};

nu              ${(waterViscosity / waterDensity).toExponential(6)};

// ************************************************************************* //
`
  });

  // constant/physicalProperties.air (OpenFOAM 11+ format)
  files.push({
    path: 'constant/physicalProperties.air',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      physicalProperties.air;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

viscosityModel  Newtonian;

rho             ${airDensity};

nu              ${(airViscosity / airDensity).toExponential(6)};

// ************************************************************************* //
`
  });

  // constant/g
  files.push({
    path: 'constant/g',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       uniformDimensionedVectorField;
    object      g;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -2 0 0 0 0];

value           (0 -${gravity} 0);

// ************************************************************************* //
`
  });

  // constant/momentumTransport
  files.push({
    path: 'constant/momentumTransport',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  11                                    |
|   \\\\  /    A nd           | Website:  www.openfoam.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      momentumTransport;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  laminar;

// ************************************************************************* //
`
  });

  // 0/alpha.water
  files.push({
    path: '0/alpha.water',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      alpha.water;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 0 0 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    leftWall
    {
        type            zeroGradient;
    }

    rightWall
    {
        type            zeroGradient;
    }

    lowerWall
    {
        type            zeroGradient;
    }

    atmosphere
    {
        type            inletOutlet;
        inletValue      uniform 0;
        value           uniform 0;
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // 0/U
  files.push({
    path: '0/U',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform (0 0 0);

boundaryField
{
    leftWall
    {
        type            noSlip;
    }

    rightWall
    {
        type            noSlip;
    }

    lowerWall
    {
        type            noSlip;
    }

    atmosphere
    {
        type            pressureInletOutletVelocity;
        value           uniform (0 0 0);
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // 0/p_rgh
  files.push({
    path: '0/p_rgh',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      p_rgh;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [1 -1 -2 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    leftWall
    {
        type            fixedFluxPressure;
        value           uniform 0;
    }

    rightWall
    {
        type            fixedFluxPressure;
        value           uniform 0;
    }

    lowerWall
    {
        type            fixedFluxPressure;
        value           uniform 0;
    }

    atmosphere
    {
        type            totalPressure;
        p0              uniform 0;
        U               U;
        phi             phi;
        rho             rho;
        psi             none;
        gamma           1;
        value           uniform 0;
    }

    frontAndBack
    {
        type            empty;
    }
}

// ************************************************************************* //
`
  });

  // system/decomposeParDict - for parallel processing
  if (runInParallel) {
    const isPowerOf2 = (numberOfProcessors & (numberOfProcessors - 1)) === 0;
    const method = isPowerOf2 ? 'simple' : 'scotch';

    let simpleCoeffs = '';
    if (method === 'simple') {
      const n = numberOfProcessors;
      let nx, ny;

      // 2D decomposition (Z direction is single cell)
      if (n === 2) {
        nx = 2; ny = 1;
      } else if (n === 4) {
        nx = 2; ny = 2;
      } else if (n === 8) {
        nx = 4; ny = 2;
      } else if (n === 16) {
        nx = 8; ny = 2;
      } else {
        // Default distribution for 2D
        nx = Math.ceil(Math.sqrt(n));
        ny = Math.ceil(n / nx);
      }

      simpleCoeffs = `
simpleCoeffs
{
    n               (${nx} ${ny} 1);
    delta           0.001;
}`;
    }

    files.push({
      path: 'system/decomposeParDict',
      content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312 / 11                            |
|   \\\\  /    A nd           | Website:  www.openfoam.com / www.openfoam.org   |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains ${numberOfProcessors};

method          ${method};
${simpleCoeffs}
// ************************************************************************* //
`
    });
  }

  return { files };
}

/**
 * Automotive Aerodynamics Case Generator
 * Generates simpleFoam case with k-ω SST turbulence and force coefficients
 */
// Helper function to generate side wall boundary conditions
function generateSideWallBCs(inletFace: string, outletFace: string, bcType: string = 'symmetryPlane'): string {
  let result = '';

  if (inletFace !== 'xMin' && outletFace !== 'xMin') {
    result += `

    leftWall
    {
        type            ${bcType};
    }`;
  }

  if (inletFace !== 'xMax' && outletFace !== 'xMax') {
    result += `

    rightWall
    {
        type            ${bcType};
    }`;
  }

  if (inletFace !== 'zMin' && outletFace !== 'zMin') {
    result += `

    frontWall
    {
        type            ${bcType};
    }`;
  }

  if (inletFace !== 'zMax' && outletFace !== 'zMax') {
    result += `

    backWall
    {
        type            ${bcType};
    }`;
  }

  return result;
}

function generateAutomotiveAerodynamicsCase(data: any): OpenFOAMCase {
  const files = [];

  // Extract parameters with proper defaults
  const referenceLength = data.referenceLength || 4.5;
  const frontalArea = data.frontalArea || 2.2;
  const vehicleSpeed = data.vehicleSpeed || 30;
  // const yawAngle = data.yawAngle || 0; // Reserved for future implementation
  const density = data.density || 1.225;
  const dynamicViscosity = data.dynamicViscosity || 1.7894e-5;
  const turbulenceModel = data.turbulenceModel || 'kOmegaSST';
  const solverType = data.solverType || 'simpleFoam';
  const endTime = data.endTime || 2000;
  const writeInterval = data.writeInterval || 100;
  const isParallel = data.runInParallel && data.numberOfProcessors > 1;
  const nProcs = data.numberOfProcessors || 4;

  // Solver stability settings (from UI)
  // Use very conservative defaults for automotive aerodynamics
  const relaxationP = data.relaxationP !== undefined ? data.relaxationP : 0.2;
  const relaxationU = data.relaxationU !== undefined ? data.relaxationU : 0.5;
  const nNonOrthogonalCorrectors = data.nNonOrthogonalCorrectors !== undefined ? data.nNonOrthogonalCorrectors : 2;

  // Domain parameters from viewer (if available)
  const domainMin = data.domainMin || [-20, 0, -10];
  const domainMax = data.domainMax || [40, 10, 10];

  // Vehicle STL data (if provided from viewer)
  const vehicleSTL = data.vehicleSTL || null;

  // Vehicle position data (if provided from viewer)
  const vehicleCenter = data.vehicleCenter || undefined;
  const vehicleBounds = data.vehicleBounds || undefined;
  const vehicleOrientation = data.vehicleOrientation || undefined;

  console.log('🔍 Case Generator - Vehicle STL Check:', {
    hasVehicleSTL: !!vehicleSTL,
    vehicleSTLType: typeof vehicleSTL,
    vehicleSTLLength: vehicleSTL ? vehicleSTL.length : 0,
    vehicleSTLPreview: vehicleSTL ? vehicleSTL.substring(0, 50) + '...' : 'null'
  });

  console.log('🔍 Case Generator - Vehicle Position Check:', {
    hasVehicleCenter: !!vehicleCenter,
    hasVehicleBounds: !!vehicleBounds,
    vehicleOrientation: vehicleOrientation,
    vehicleCenter: vehicleCenter,
    vehicleBounds: vehicleBounds
  });

  // Mesh quality settings
  const meshRefinementLevel = data.meshRefinementLevel !== undefined ? data.meshRefinementLevel : 1;

  // Result file output settings
  const writeControl = data.writeControl || 'timeStep';
  const writeFormat = data.writeFormat || 'binary';
  const writePrecision = data.writePrecision || 6;
  const writeCompression = data.writeCompression !== undefined ? data.writeCompression : false;
  const purgeWrite = data.purgeWrite !== undefined ? data.purgeWrite : 0;

  // Calculate derived parameters
  const kinematicViscosity = dynamicViscosity / density;
  const reynoldsNumber = (vehicleSpeed * referenceLength) / kinematicViscosity;

  // Domain size
  const domainSizeX = domainMax[0] - domainMin[0];
  const domainSizeY = domainMax[1] - domainMin[1];
  const domainSizeZ = domainMax[2] - domainMin[2];

  // Mesh resolution - Use coarser mesh for stability
  // Cell size adjusted based on mesh refinement level
  const baseCellSize = 1.0; // Base cell size in meters (coarse)
  const refinementFactor = Math.pow(0.5, meshRefinementLevel); // 0: 1.0m, 1: 0.5m, 2: 0.25m
  const cellSize = baseCellSize * refinementFactor;

  const cellsX = Math.max(20, Math.floor(domainSizeX / cellSize));
  const cellsY = Math.max(10, Math.floor(domainSizeY / cellSize));
  const cellsZ = Math.max(20, Math.floor(domainSizeZ / cellSize));

  // Determine inlet/outlet based on flow direction
  const inletFace = data.inletFace || 'xMin';
  const outletFace = data.outletFace || 'xMax';

  // Calculate inlet velocity vector based on inlet face direction
  let inletVelocity = '(0 0 0)';
  if (inletFace === 'xMin') {
    inletVelocity = `(${vehicleSpeed} 0 0)`;
  } else if (inletFace === 'xMax') {
    inletVelocity = `(${-vehicleSpeed} 0 0)`;
  } else if (inletFace === 'zMin') {
    inletVelocity = `(0 0 ${vehicleSpeed})`;
  } else if (inletFace === 'zMax') {
    inletVelocity = `(0 0 ${-vehicleSpeed})`;
  }

  // Calculate turbulence parameters
  // Turbulence intensity: typically 1-5% for automotive aerodynamics
  const turbulenceIntensity = 0.02; // 2%
  const turbulentKE = 1.5 * Math.pow(vehicleSpeed * turbulenceIntensity, 2);
  // Turbulent length scale: approximately 7% of characteristic length
  const turbulentLengthScale = 0.07 * referenceLength;
  // Specific dissipation rate omega = k^0.5 / (Cmu^0.25 * l)
  const Cmu = 0.09;
  const omega = Math.pow(turbulentKE, 0.5) / (Math.pow(Cmu, 0.25) * turbulentLengthScale);

  console.log('🚗 Automotive Aerodynamics Case:', {
    domain: `${domainSizeX.toFixed(1)}m × ${domainSizeY.toFixed(1)}m × ${domainSizeZ.toFixed(1)}m`,
    mesh: `${cellsX} × ${cellsY} × ${cellsZ} cells`,
    vehicle: vehicleSTL ? '✅ Included' : '❌ Not included',
    inlet: inletFace,
    inletVelocity: inletVelocity,
    turbulence: {
      k: turbulentKE.toFixed(4),
      omega: omega.toFixed(4),
      nu: kinematicViscosity.toExponential(4)
    }
  });

  // README.md
  files.push({
    path: 'README.md',
    content: `# Automotive Aerodynamics Case

## Case Description
External aerodynamics simulation for automotive applications using ${solverType} solver.

## Case Parameters
- Reference Length: ${referenceLength} m
- Frontal Area: ${frontalArea} m²
- Vehicle Speed: ${vehicleSpeed} m/s (${(vehicleSpeed * 3.6).toFixed(1)} km/h)
- Reynolds Number: ${reynoldsNumber.toExponential(2)}
- Turbulence Model: ${turbulenceModel}
- Domain: [${domainSizeX.toFixed(1)} × ${domainSizeY.toFixed(1)} × ${domainSizeZ.toFixed(1)}] m
- Mesh: ${cellsX} × ${cellsY} × ${cellsZ} cells (~${((cellsX * cellsY * cellsZ) / 1e6).toFixed(1)}M cells)
- Solver: ${solverType}
- End Time: ${endTime} iterations
- Write Interval: ${writeInterval} iterations
- Parallel: ${isParallel ? `Yes (${nProcs} processors)` : 'No (serial)'}

### Solver Stability Settings
- Pressure Relaxation (p): ${relaxationP.toFixed(2)} (conservative for stability)
- Velocity Relaxation (U): ${relaxationU.toFixed(2)} (conservative for stability)
- Non-Orthogonal Correctors: ${nNonOrthogonalCorrectors}
- Pressure Reference: Cell 0, Value 0 (prevents floating point errors)
- Solver Tolerance: 1e-06 (tight convergence)
- Note: These conservative settings prioritize stability over speed

## Quick Start

### 1. Setup OpenFOAM Environment
\`\`\`bash
source /opt/openfoam2312/etc/bashrc
\`\`\`

### 2. Run Case
\`\`\`bash
chmod +x Allrun Allclean
./Allrun
\`\`\`

### 3. View Results
\`\`\`bash
# Create .foam file for ParaView
touch case.foam
# Open in ParaView
paraview case.foam
\`\`\`

## Manual Execution

${isParallel ? `### Parallel Execution (${nProcs} processors)
\`\`\`bash
# Generate mesh
blockMesh
surfaceFeatures
snappyHexMesh -overwrite

# Check mesh
checkMesh

# Initialize flow field (IMPORTANT for stability!)
potentialFoam -initialiseUBCs

# Decompose for parallel
decomposePar

# Run solver
mpirun -np ${nProcs} ${solverType} -parallel

# Reconstruct
reconstructPar

# View results
paraFoam
\`\`\`` : `### Serial Execution
\`\`\`bash
# Generate mesh
blockMesh
surfaceFeatures
snappyHexMesh -overwrite

# Check mesh
checkMesh

# Initialize flow field (IMPORTANT for stability!)
potentialFoam -initialiseUBCs

# Run solver
${solverType}

# View results
paraFoam
\`\`\``}

## Important Notes

### Mesh Generation

**Refinement Strategy**:
1. **Vehicle Surface**: Highest refinement (level ${meshRefinementLevel + 2}) directly on vehicle surface
2. **Near-Vehicle**: Medium refinement within 0.5m-1.0m from vehicle
3. **Frontend Region**: Enhanced refinement in upstream 30% of domain
   - Captures pressure buildup and stagnation point accurately
   - Critical for accurate drag force calculation
   - Refinement level: ${Math.max(1, meshRefinementLevel)}
4. **Near-Wake Region**: Very high refinement immediately behind vehicle (50%-70% of domain)
   - Captures initial vortex formation and flow separation
   - Critical for accurate base pressure and drag calculation
   - Highest wake refinement level: ${Math.max(1, meshRefinementLevel + 1)}
5. **Far-Wake Region**: High refinement in downstream region (70%-100% of domain)
   - Captures developed wake structure and vortex shedding
   - Important for realistic flow field and lift forces
   - Refinement level: ${Math.max(1, meshRefinementLevel)}
6. **Boundary Layers**: ${Math.min(3 + meshRefinementLevel, 5)} layers on vehicle surface for accurate wall shear stress

**Implementation**:
- **locationInMesh**: Positioned at inlet side (5% from domain start) to ensure it's OUTSIDE the vehicle
- **snappyHexMesh** removes cells inside the vehicle geometry
- Frontend and wake boxes automatically adjust based on flow direction
- Always check \`log.snappyHexMesh\` for "cells removed" message
- If simulation diverges, verify vehicle interior cells were removed in ParaView

### Initial Conditions
- **potentialFoam** is used to create a physically realistic initial velocity field
- This prevents the unrealistic uniform 30 m/s inside the vehicle
- Significantly improves solver stability and convergence
- If potentialFoam fails, simulation may diverge immediately

### Troubleshooting Divergence

**Floating Point Exception (FPE)**:
If you see "Floating point exception" or "sigFpe" errors:
1. Verify \`log.potentialFoam\` completed successfully (initializes flow field)
2. Check \`log.checkMesh\` for severe mesh quality issues (non-orthogonality > 70)
3. Ensure snappyHexMesh removed vehicle interior cells (check \`log.snappyHexMesh\`)
4. Lower mesh refinement level to 1 or 0 (coarser = more stable)

**Diverging Residuals**:
If residuals increase instead of decrease:
1. Check \`log.snappyHexMesh\` - ensure cells were removed from vehicle interior
2. Open in ParaView and slice through vehicle to verify it's hollow
3. Further lower relaxation factors: p=0.1, U=0.3 (edit system/fvSolution)
4. Increase nNonOrthogonalCorrectors to 3
5. Use coarser mesh (refinement level 0 or 1)

## Post-Processing

### Force Coefficients
The case monitors drag and lift coefficients in real-time.
Check the log file or postProcessing/forceCoeffs directory.

### Visualization
- Pressure distribution on vehicle surface
- Velocity streamlines
- Vorticity visualization
- Wake structure analysis
`
  });

  // Allrun script
  files.push({
    path: 'Allrun',
    content: `#!/bin/bash
cd "\${0%/*}" || exit 1

# Source OpenFOAM environment
# source /opt/openfoam2312/etc/bashrc

echo "Starting automotive aerodynamics simulation..."

# Clean any previous run
if [ -d "processor0" ]; then
    echo "Cleaning previous parallel run..."
    rm -rf processor*
fi

# Generate mesh
echo "Generating mesh..."
blockMesh > log.blockMesh 2>&1

# Extract surface features
if [ -f "constant/triSurface/vehicle.stl" ]; then
    echo "Extracting surface features..."
    surfaceFeatures > log.surfaceFeatures 2>&1

    echo "Refining mesh with snappyHexMesh..."
    snappyHexMesh -overwrite > log.snappyHexMesh 2>&1

    # Check if snappyHexMesh succeeded
    if [ $? -ne 0 ]; then
        echo "ERROR: snappyHexMesh failed! Check log.snappyHexMesh"
        exit 1
    fi

    echo "Checking if vehicle interior cells were removed..."
    grep -A 5 "cells removed" log.snappyHexMesh
else
    echo "Warning: vehicle.stl not found, using base mesh only"
fi

# Check mesh quality
echo "Checking mesh..."
checkMesh > log.checkMesh 2>&1

# Check for fatal mesh errors
if grep -q "Failed" log.checkMesh; then
    echo "WARNING: Mesh quality issues detected. Check log.checkMesh"
    echo "Continuing anyway, but simulation may fail..."
fi

# Initialize flow field with potentialFoam (creates realistic initial conditions)
if [ -f "constant/triSurface/vehicle.stl" ]; then
    echo "Initializing flow field with potentialFoam..."
    potentialFoam -initialiseUBCs > log.potentialFoam 2>&1

    if [ $? -eq 0 ]; then
        echo "✓ Initial flow field created successfully"
    else
        echo "WARNING: potentialFoam failed, using uniform initial conditions"
    fi
fi

${isParallel ? `# Decompose for parallel processing
echo "Decomposing domain for ${nProcs} processors..."
decomposePar > log.decomposePar 2>&1

# Run solver in parallel
echo "Running ${solverType} in parallel..."
mpirun -np ${nProcs} ${solverType} -parallel > log.${solverType} 2>&1

# Reconstruct the case
echo "Reconstructing parallel case..."
reconstructPar -latestTime > log.reconstructPar 2>&1` : `# Run solver
echo "Running ${solverType}..."
${solverType} > log.${solverType} 2>&1`}

echo "Simulation complete!"
echo "View results with: paraFoam"
`
  });

  // Allclean script
  files.push({
    path: 'Allclean',
    content: `#!/bin/bash
cd "\${0%/*}" || exit 1

echo "Cleaning case..."

# Clean mesh
rm -rf constant/polyMesh
rm -rf constant/extendedFeatureEdgeMesh
rm -f constant/triSurface/*.eMesh

# Clean time directories
rm -rf 0.* [1-9]*

# Clean processor directories (parallel)
rm -rf processor*

# Clean logs
rm -f log.*

# Clean postProcessing
rm -rf postProcessing

# Clean VTK if exists
rm -rf VTK

# Clean paraview files
rm -f *.foam *.OpenFOAM

echo "Cleanup complete!"
`
  });

  // system/blockMeshDict
  files.push({
    path: 'system/blockMeshDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

scale   1.0;

vertices
(
    (${domainMin[0]} ${domainMin[1]} ${domainMin[2]})  // 0
    (${domainMax[0]} ${domainMin[1]} ${domainMin[2]})  // 1
    (${domainMax[0]} ${domainMax[1]} ${domainMin[2]})  // 2
    (${domainMin[0]} ${domainMax[1]} ${domainMin[2]})  // 3
    (${domainMin[0]} ${domainMin[1]} ${domainMax[2]})  // 4
    (${domainMax[0]} ${domainMin[1]} ${domainMax[2]})  // 5
    (${domainMax[0]} ${domainMax[1]} ${domainMax[2]})  // 6
    (${domainMin[0]} ${domainMax[1]} ${domainMax[2]})  // 7
);

blocks
(
    hex (0 1 2 3 4 5 6 7) (${cellsX} ${cellsY} ${cellsZ}) simpleGrading (1 1 1)
);

edges
(
);

boundary
(
    inlet
    {
        type patch;
        faces
        (
            ${inletFace === 'xMin' ? '(0 3 7 4)' : inletFace === 'xMax' ? '(1 5 6 2)' : inletFace === 'zMin' ? '(0 1 2 3)' : '(4 7 6 5)'}
        );
    }
    outlet
    {
        type patch;
        faces
        (
            ${outletFace === 'xMin' ? '(0 3 7 4)' : outletFace === 'xMax' ? '(1 5 6 2)' : outletFace === 'zMin' ? '(0 1 2 3)' : '(4 7 6 5)'}
        );
    }
    ground
    {
        type wall;
        faces
        (
            (0 4 5 1)  // yMin - ground
        );
    }
    top
    {
        type symmetryPlane;
        faces
        (
            (3 2 6 7)  // yMax - top
        );
    }${
    // Add side walls only if they're not used for inlet/outlet
    (inletFace !== 'xMin' && outletFace !== 'xMin') ? `
    leftWall
    {
        type symmetryPlane;
        faces
        (
            (0 3 7 4)  // xMin
        );
    }` : ''
    }${
    (inletFace !== 'xMax' && outletFace !== 'xMax') ? `
    rightWall
    {
        type symmetryPlane;
        faces
        (
            (1 5 6 2)  // xMax
        );
    }` : ''
    }${
    (inletFace !== 'zMin' && outletFace !== 'zMin') ? `
    frontWall
    {
        type symmetryPlane;
        faces
        (
            (0 1 2 3)  // zMin
        );
    }` : ''
    }${
    (inletFace !== 'zMax' && outletFace !== 'zMax') ? `
    backWall
    {
        type symmetryPlane;
        faces
        (
            (4 7 6 5)  // zMax
        );
    }` : ''
    }
);

// ************************************************************************* //`
  });

  // system/controlDict
  files.push({
    path: 'system/controlDict',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     ${solverType};

startFrom       startTime;

startTime       0;

stopAt          endTime;

endTime         ${endTime};

deltaT          1;

writeControl    ${writeControl};

writeInterval   ${writeInterval};

purgeWrite      ${purgeWrite};

writeFormat     ${writeFormat};

writePrecision  ${writePrecision};

writeCompression ${writeCompression ? 'on' : 'off'};

timeFormat      general;

timePrecision   6;

runTimeModifiable true;

functions
{
    forces
    {
        type            forces;
        libs            ("libforces.so");
        writeControl    timeStep;
        writeInterval   1;

        patches         (vehicle);
        rho             rhoInf;
        rhoInf          ${density};

        CofR            (0 0 0);
        pitchAxis       (0 1 0);

        log             true;
    }

    forceCoeffs
    {
        type            forceCoeffs;
        libs            ("libforces.so");
        writeControl    timeStep;
        writeInterval   1;

        patches         (vehicle);
        rho             rhoInf;
        rhoInf          ${density};

        liftDir         (0 0 1);
        dragDir         (1 0 0);

        CofR            (0 0 0);
        pitchAxis       (0 1 0);

        magUInf         ${vehicleSpeed};
        lRef            ${referenceLength};
        Aref            ${frontalArea};

        log             true;
    }
}

// ************************************************************************* //`
  });

  // system/fvSchemes
  files.push({
    path: 'system/fvSchemes',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         steadyState;
}

gradSchemes
{
    default         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      bounded Gauss linearUpwind grad(U);
    div(phi,k)      bounded Gauss upwind;
    div(phi,omega)  bounded Gauss upwind;
    div((nuEff*dev2(T(grad(U))))) Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear corrected;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         corrected;
}

wallDist
{
    method meshWave;
}

// ************************************************************************* //`
  });

  // system/fvSolution
  files.push({
    path: 'system/fvSolution',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p
    {
        solver          GAMG;
        tolerance       1e-06;
        relTol          0.01;
        smoother        GaussSeidel;
        nPreSweeps      0;
        nPostSweeps     2;
        nFinestSweeps   2;
        cacheAgglomeration true;
        nCellsInCoarsestLevel 10;
        agglomerator    faceAreaPair;
        mergeLevels     1;
        maxIter         200;
        minIter         3;
    }

    U
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-06;
        relTol          0.01;
        nSweeps         2;
        maxIter         200;
        minIter         1;
    }

    "(k|omega)"
    {
        solver          smoothSolver;
        smoother        symGaussSeidel;
        tolerance       1e-06;
        relTol          0.01;
        nSweeps         2;
        maxIter         200;
        minIter         1;
    }
}

SIMPLE
{
    nNonOrthogonalCorrectors ${nNonOrthogonalCorrectors};
    consistent      yes;

    // Pressure reference for numerical stability
    pRefCell        0;
    pRefValue       0;

    residualControl
    {
        p               1e-3;
        U               1e-3;
        "(k|omega)"     1e-3;
    }
}

relaxationFactors
{
    fields
    {
        p               ${relaxationP.toFixed(2)};
    }
    equations
    {
        U               ${relaxationU.toFixed(2)};
        k               ${relaxationU.toFixed(2)};
        omega           ${relaxationU.toFixed(2)};
    }
}

// ************************************************************************* //`
  });

  // 0/U - Velocity boundary conditions
  files.push({
    path: '0/U',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volVectorField;
    object      U;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform ${inletVelocity};

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform ${inletVelocity};
    }

    outlet
    {
        type            zeroGradient;
    }

    ground
    {
        type            fixedValue;
        value           uniform (0 0 0);
    }

    top
    {
        type            symmetryPlane;
    }${
    (inletFace !== 'xMin' && outletFace !== 'xMin') ? `

    leftWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'xMax' && outletFace !== 'xMax') ? `

    rightWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'zMin' && outletFace !== 'zMin') ? `

    frontWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'zMax' && outletFace !== 'zMax') ? `

    backWall
    {
        type            symmetryPlane;
    }` : ''
    }

    vehicle
    {
        type            fixedValue;
        value           uniform (0 0 0);
    }
}

// ************************************************************************* //`
  });

  // 0/p - Pressure boundary conditions
  files.push({
    path: '0/p',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    inlet
    {
        type            zeroGradient;
    }

    outlet
    {
        type            fixedValue;
        value           uniform 0;
    }

    ground
    {
        type            zeroGradient;
    }

    top
    {
        type            symmetryPlane;
    }${
    (inletFace !== 'xMin' && outletFace !== 'xMin') ? `

    leftWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'xMax' && outletFace !== 'xMax') ? `

    rightWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'zMin' && outletFace !== 'zMin') ? `

    frontWall
    {
        type            symmetryPlane;
    }` : ''
    }${
    (inletFace !== 'zMax' && outletFace !== 'zMax') ? `

    backWall
    {
        type            symmetryPlane;
    }` : ''
    }

    vehicle
    {
        type            zeroGradient;
    }
}

// ************************************************************************* //`
  });

  // 0/k - Turbulent kinetic energy
  files.push({
    path: '0/k',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      k;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform ${turbulentKE.toFixed(6)};

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform ${turbulentKE.toFixed(6)};
    }

    outlet
    {
        type            zeroGradient;
    }

    ground
    {
        type            kqRWallFunction;
        value           uniform ${turbulentKE.toFixed(6)};
    }

    top
    {
        type            symmetryPlane;
    }${generateSideWallBCs(inletFace, outletFace)}

    vehicle
    {
        type            kqRWallFunction;
        value           uniform ${turbulentKE.toFixed(6)};
    }
}

// ************************************************************************* //`
  });

  // 0/omega - Specific turbulence dissipation rate
  files.push({
    path: '0/omega',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      omega;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 0 -1 0 0 0 0];

internalField   uniform ${omega.toFixed(6)};

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform ${omega.toFixed(6)};
    }

    outlet
    {
        type            zeroGradient;
    }

    ground
    {
        type            omegaWallFunction;
        value           uniform ${omega.toFixed(6)};
    }

    top
    {
        type            symmetryPlane;
    }${generateSideWallBCs(inletFace, outletFace)}

    vehicle
    {
        type            omegaWallFunction;
        value           uniform ${omega.toFixed(6)};
    }
}

// ************************************************************************* //`
  });

  // 0/nut - Turbulent viscosity
  files.push({
    path: '0/nut',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      nut;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -1 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    inlet
    {
        type            calculated;
        value           uniform 0;
    }

    outlet
    {
        type            calculated;
        value           uniform 0;
    }

    ground
    {
        type            nutkWallFunction;
        value           uniform 0;
    }

    top
    {
        type            symmetryPlane;
    }${generateSideWallBCs(inletFace, outletFace)}

    vehicle
    {
        type            nutkWallFunction;
        value           uniform 0;
    }
}

// ************************************************************************* //`
  });

  // constant/transportProperties
  files.push({
    path: 'constant/transportProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

transportModel  Newtonian;

nu              ${kinematicViscosity.toExponential(6)};

// ************************************************************************* //`
  });

  // constant/turbulenceProperties
  files.push({
    path: 'constant/turbulenceProperties',
    content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      turbulenceProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  RAS;

RAS
{
    RASModel        ${turbulenceModel};

    turbulence      on;

    printCoeffs     on;
}

// ************************************************************************* //`
  });

  // system/decomposeParDict (if parallel)
  if (isParallel) {
    files.push({
      path: 'system/decomposeParDict',
      content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      decomposeParDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

numberOfSubdomains  ${nProcs};

method              scotch;

// ************************************************************************* //`
    });
  }

  // If STL data is provided, add it
  console.log('🚗 STL File Addition Check:', {
    willAddSTL: !!vehicleSTL,
    vehicleSTLExists: vehicleSTL !== null && vehicleSTL !== undefined,
    vehicleSTLLength: vehicleSTL ? vehicleSTL.length : 0
  });

  if (vehicleSTL) {
    console.log('✅ Adding vehicle STL to case:', {
      length: vehicleSTL.length,
      path: 'constant/triSurface/vehicle.stl',
      preview: vehicleSTL.substring(0, 100)
    });

    files.push({
      path: 'constant/triSurface/vehicle.stl',
      content: vehicleSTL
    });

    console.log('✅ Vehicle STL file added to files array. Total files:', files.length);

    // Add snappyHexMeshDict for mesh refinement
    files.push({
      path: 'system/snappyHexMeshDict',
      content: generateSnappyHexMeshDict(meshRefinementLevel, domainMin, domainMax, inletFace, vehicleCenter, vehicleBounds, vehicleOrientation)
    });

    // Add surfaceFeatures
    files.push({
      path: 'system/surfaceFeaturesDict',
      content: `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      surfaceFeaturesDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

vehicle.stl
{
    surfaces
    (
        "vehicle.stl"
    );

    extractionMethod    extractFromSurface;

    includedAngle       150;

    writeObj            yes;
}

// ************************************************************************* //`
    });
  } else {
    // Add a note in README about missing STL
    const readmeIndex = files.findIndex(f => f.path === 'README.md');
    if (readmeIndex >= 0) {
      files[readmeIndex].content += `

## ⚠️ WARNING
No vehicle STL geometry was provided. The simulation will run with an empty domain.
To include the vehicle geometry, ensure a model is loaded in the viewer before generating the case.
`;
    }
  }

  return { files };
}

// Helper function for snappyHexMeshDict
function generateSnappyHexMeshDict(
  refinementLevel: number = 1,
  domainMin: number[] = [-20, 0, -10],
  domainMax: number[] = [40, 10, 10],
  inletFace: string = 'xMin',
  vehicleCenter?: number[],
  vehicleBounds?: { min: number[], max: number[] },
  vehicleOrientation?: string
): string {
  // Refinement levels based on quality setting
  // Level 0: Coarse (1-2), Level 1: Medium (2-3), Level 2: Fine (3-4), Level 3: Very Fine (4-5)
  const surfaceMinLevel = refinementLevel + 1;
  const surfaceMaxLevel = refinementLevel + 2;
  const featureLevel = refinementLevel + 1;
  const nSurfaceLayers = Math.min(3 + refinementLevel, 5);

  // Calculate locationInMesh - MUST be outside vehicle, in the flow domain
  // Place it upstream (inlet side) safely away from vehicle to ensure proper mesh generation
  // Strategy: Place point near inlet boundary, offset from corners to avoid boundary issues

  let locX: number, locY: number, locZ: number;

  // Determine which face is inlet and position point accordingly
  if (inletFace === 'xMin') {
    // Flow in +X direction: place point near xMin (upstream)
    locX = domainMin[0] + 0.05 * (domainMax[0] - domainMin[0]);
    locY = domainMin[1] + 0.3 * (domainMax[1] - domainMin[1]); // Lower third (away from ground and vehicle center)
    locZ = domainMin[2] + 0.3 * (domainMax[2] - domainMin[2]); // Side offset
  } else if (inletFace === 'xMax') {
    // Flow in -X direction: place point near xMax (upstream)
    locX = domainMin[0] + 0.95 * (domainMax[0] - domainMin[0]);
    locY = domainMin[1] + 0.3 * (domainMax[1] - domainMin[1]);
    locZ = domainMin[2] + 0.3 * (domainMax[2] - domainMin[2]);
  } else if (inletFace === 'zMin') {
    // Flow in +Z direction: place point near zMin (upstream)
    locX = domainMin[0] + 0.3 * (domainMax[0] - domainMin[0]);
    locY = domainMin[1] + 0.3 * (domainMax[1] - domainMin[1]);
    locZ = domainMin[2] + 0.05 * (domainMax[2] - domainMin[2]);
  } else if (inletFace === 'zMax') {
    // Flow in -Z direction: place point near zMax (upstream)
    locX = domainMin[0] + 0.3 * (domainMax[0] - domainMin[0]);
    locY = domainMin[1] + 0.3 * (domainMax[1] - domainMin[1]);
    locZ = domainMin[2] + 0.95 * (domainMax[2] - domainMin[2]);
  } else {
    // Default fallback (xMin)
    locX = domainMin[0] + 0.05 * (domainMax[0] - domainMin[0]);
    locY = domainMin[1] + 0.3 * (domainMax[1] - domainMin[1]);
    locZ = domainMin[2] + 0.3 * (domainMax[2] - domainMin[2]);
  }

  const locXStr = locX.toFixed(2);
  const locYStr = locY.toFixed(2);
  const locZStr = locZ.toFixed(2);

  // Calculate frontend and wake refinement boxes
  // Frontend box: high refinement where air first hits the vehicle
  // Near-wake box: very high refinement immediately behind vehicle (critical for drag)
  // Far-wake box: high refinement in the developed wake region
  const domainSizeX = domainMax[0] - domainMin[0];
  const domainSizeZ = domainMax[2] - domainMin[2];

  let frontBoxMin: string, frontBoxMax: string;
  let wakeBoxMin: string, wakeBoxMax: string;
  let nearWakeBoxMin: string, nearWakeBoxMax: string;

  // Use vehicle position if available, otherwise fall back to fixed percentages
  if (vehicleBounds && vehicleCenter && vehicleOrientation) {
    // Calculate wake boxes relative to vehicle position
    const vehicleLength = vehicleOrientation === 'X'
      ? (vehicleBounds.max[0] - vehicleBounds.min[0])
      : (vehicleBounds.max[2] - vehicleBounds.min[2]);

    // Near-wake: 0 to 2.0 vehicle lengths behind vehicle
    // Far-wake: 2.0 to 5.0 vehicle lengths behind vehicle
    const nearWakeLength = 2.0 * vehicleLength;
    const farWakeLength = 3.0 * vehicleLength;

    if (inletFace === 'xMin') {
      // Flow in +X direction: wake is downstream (+X)
      const vehicleRear = vehicleBounds.max[0];
      const nearWakeEnd = Math.min(vehicleRear + nearWakeLength, domainMax[0]);
      const farWakeEnd = Math.min(vehicleRear + nearWakeLength + farWakeLength, domainMax[0]);

      // Frontend: from inlet to vehicle front
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${vehicleBounds.min[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      // Near-wake: immediate rear
      nearWakeBoxMin = `(${vehicleRear.toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      nearWakeBoxMax = `(${nearWakeEnd.toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      // Far-wake: developed wake
      wakeBoxMin = `(${nearWakeEnd.toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      wakeBoxMax = `(${farWakeEnd.toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
    } else if (inletFace === 'xMax') {
      // Flow in -X direction: wake is downstream (-X)
      const vehicleRear = vehicleBounds.min[0];
      const nearWakeEnd = Math.max(vehicleRear - nearWakeLength, domainMin[0]);
      const farWakeEnd = Math.max(vehicleRear - nearWakeLength - farWakeLength, domainMin[0]);

      // Frontend: from inlet to vehicle front
      frontBoxMin = `(${vehicleBounds.max[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      // Near-wake: immediate rear
      nearWakeBoxMin = `(${nearWakeEnd.toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      nearWakeBoxMax = `(${vehicleRear.toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      // Far-wake: developed wake
      wakeBoxMin = `(${farWakeEnd.toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      wakeBoxMax = `(${nearWakeEnd.toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
    } else if (inletFace === 'zMin') {
      // Flow in +Z direction: wake is downstream (+Z)
      const vehicleRear = vehicleBounds.max[2];
      const nearWakeEnd = Math.min(vehicleRear + nearWakeLength, domainMax[2]);
      const farWakeEnd = Math.min(vehicleRear + nearWakeLength + farWakeLength, domainMax[2]);

      // Frontend: from inlet to vehicle front
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${vehicleBounds.min[2].toFixed(2)})`;
      // Near-wake: immediate rear
      nearWakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${vehicleRear.toFixed(2)})`;
      nearWakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${nearWakeEnd.toFixed(2)})`;
      // Far-wake: developed wake
      wakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${nearWakeEnd.toFixed(2)})`;
      wakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${farWakeEnd.toFixed(2)})`;
    } else {
      // Flow in -Z direction: wake is downstream (-Z)
      const vehicleRear = vehicleBounds.min[2];
      const nearWakeEnd = Math.max(vehicleRear - nearWakeLength, domainMin[2]);
      const farWakeEnd = Math.max(vehicleRear - nearWakeLength - farWakeLength, domainMin[2]);

      // Frontend: from inlet to vehicle front
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${vehicleBounds.max[2].toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      // Near-wake: immediate rear
      nearWakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${nearWakeEnd.toFixed(2)})`;
      nearWakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${vehicleRear.toFixed(2)})`;
      // Far-wake: developed wake
      wakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${farWakeEnd.toFixed(2)})`;
      wakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${nearWakeEnd.toFixed(2)})`;
    }
  } else {
    // Fallback: use fixed domain percentages if vehicle position not available
    if (inletFace === 'xMin') {
      // Flow in +X direction
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${(domainMin[0] + 0.3 * domainSizeX).toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      nearWakeBoxMin = `(${(domainMin[0] + 0.5 * domainSizeX).toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      nearWakeBoxMax = `(${(domainMin[0] + 0.7 * domainSizeX).toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      wakeBoxMin = `(${(domainMin[0] + 0.7 * domainSizeX).toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      wakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
    } else if (inletFace === 'xMax') {
      // Flow in -X direction
      frontBoxMin = `(${(domainMin[0] + 0.7 * domainSizeX).toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      nearWakeBoxMin = `(${(domainMin[0] + 0.3 * domainSizeX).toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      nearWakeBoxMax = `(${(domainMin[0] + 0.5 * domainSizeX).toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      wakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      wakeBoxMax = `(${(domainMin[0] + 0.3 * domainSizeX).toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
    } else if (inletFace === 'zMin') {
      // Flow in +Z direction
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${(domainMin[2] + 0.3 * domainSizeZ).toFixed(2)})`;
      nearWakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${(domainMin[2] + 0.5 * domainSizeZ).toFixed(2)})`;
      nearWakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${(domainMin[2] + 0.7 * domainSizeZ).toFixed(2)})`;
      wakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${(domainMin[2] + 0.7 * domainSizeZ).toFixed(2)})`;
      wakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
    } else {
      // Flow in -Z direction (zMax)
      frontBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${(domainMin[2] + 0.7 * domainSizeZ).toFixed(2)})`;
      frontBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${domainMax[2].toFixed(2)})`;
      nearWakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${(domainMin[2] + 0.3 * domainSizeZ).toFixed(2)})`;
      nearWakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${(domainMin[2] + 0.5 * domainSizeZ).toFixed(2)})`;
      wakeBoxMin = `(${domainMin[0].toFixed(2)} ${domainMin[1].toFixed(2)} ${domainMin[2].toFixed(2)})`;
      wakeBoxMax = `(${domainMax[0].toFixed(2)} ${domainMax[1].toFixed(2)} ${(domainMin[2] + 0.3 * domainSizeZ).toFixed(2)})`;
    }
  }

  return `/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  v2312                                 |
|   \\\\  /    A nd           | Website:  www.openfoam.com                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      snappyHexMeshDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

castellatedMesh true;
snap            true;
addLayers       true;

geometry
{
    vehicle.stl
    {
        type triSurfaceMesh;
        name vehicle;
    }

    frontendBox
    {
        type searchableBox;
        min ${frontBoxMin};
        max ${frontBoxMax};
    }

    nearWakeBox
    {
        type searchableBox;
        min ${nearWakeBoxMin};
        max ${nearWakeBoxMax};
    }

    wakeBox
    {
        type searchableBox;
        min ${wakeBoxMin};
        max ${wakeBoxMax};
    }
}

castellatedMeshControls
{
    maxLocalCells 1000000;
    maxGlobalCells 10000000;
    minRefinementCells 10;
    maxLoadUnbalance 0.10;
    nCellsBetweenLevels 3;

    features
    (
        {
            file "vehicle.eMesh";
            level ${featureLevel};
        }
    );

    refinementSurfaces
    {
        vehicle
        {
            level (${surfaceMinLevel} ${surfaceMaxLevel});
            patchInfo
            {
                type wall;
            }
        }
    }

    resolveFeatureAngle 30;

    refinementRegions
    {
        vehicle
        {
            mode distance;
            levels ((0.5 2) (1.0 1));
        }

        frontendBox
        {
            mode inside;
            levels ((1 ${Math.max(1, refinementLevel)}));
        }

        nearWakeBox
        {
            mode inside;
            levels ((1 ${Math.max(1, refinementLevel + 1)}));
        }

        wakeBox
        {
            mode inside;
            levels ((1 ${Math.max(1, refinementLevel)}));
        }
    }

    locationInMesh (${locXStr} ${locYStr} ${locZStr});
    allowFreeStandingZoneFaces true;
}

snapControls
{
    nSmoothPatch 3;
    tolerance 2.0;
    nSolveIter 100;
    nRelaxIter 5;
}

addLayersControls
{
    relativeSizes true;
    layers
    {
        vehicle
        {
            nSurfaceLayers ${nSurfaceLayers};
        }
    }

    expansionRatio 1.2;
    finalLayerThickness 0.5;
    minThickness 0.1;
    featureAngle 180;
    slipFeatureAngle 30;
    nGrow 0;
    nSmoothSurfaceNormals 1;
    nSmoothThickness 10;
    nSmoothNormals 3;
    maxFaceThicknessRatio 0.5;
    maxThicknessToMedialRatio 0.3;
    minMedialAxisAngle 90;
    nBufferCellsNoExtrude 0;
    nLayerIter 50;
    nRelaxIter 5;
}

meshQualityControls
{
    maxNonOrtho 65;
    maxBoundarySkewness 20;
    maxInternalSkewness 4;
    maxConcave 80;
    minVol 1e-15;
    minTetQuality 1e-30;
    minArea -1;
    minTwist 0.001;
    minDeterminant 0.0001;
    minFaceWeight 0.001;
    minVolRatio 0.001;
    minTriangleTwist -1;
    nSmoothScale 4;
    errorReduction 0.75;
}

mergeTolerance 1e-6;

// ************************************************************************* //`;
}
