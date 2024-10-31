/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      "./project_front/**/*.{html,js,jsx,ts,tsx}"
  ],
  safelist: [
    {
      pattern: /(bg|text|border|outline)-(primary|secondary|grayscale|danger|warning|success)-+/, // You can display all the colors that you need
      variants: ['hover', 'focus'],      // Optional
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        'nanumSquareR' : 'NanumSquare R',
        'nanumSquareB' : 'NanumSquare B',
        'nanumSquareEB' : 'NanumSquare EB'
      },
      fontSize: {
        lg19: ['19px', '24.7px']
      },
      width: {
        sidebar : `var(--width-side-bar)`,
      },
      height: {
        header: `var(--height-header)`,
        footer: `var(--height-footer)`
      },
      spacing: {
        sidebar : `var(--width-side-bar)`,
        header: `var(--height-header)`,
        footer: `var(--height-footer)`
      },
      content: {
        iconArrow : 'url("../assets/images/icon_arrow.svg")',
      },
      colors: {
        'primary': {
           50: `var(--color-primary-50)`,
          100: `var(--color-primary-100)`,
          200: `var(--color-primary-200)`,
          300: `var(--color-primary-300)`,
          400: `var(--color-primary-400)`,
          500: `var(--color-primary-500)`,
          600: `var(--color-primary-600)`,
          700: `var(--color-primary-700)`,
          800: `var(--color-primary-800)`,
          900: `var(--color-primary-900)`,
          950: `var(--color-primary-950)`,
        },
        'secondary': {
           50: `var(--color-secondary-50)`,
          100: `var(--color-secondary-100)`,
          200: `var(--color-secondary-200)`,
          300: `var(--color-secondary-300)`,
          400: `var(--color-secondary-400)`,
          500: `var(--color-secondary-500)`,
          600: `var(--color-secondary-600)`,
          700: `var(--color-secondary-700)`,
          800: `var(--color-secondary-800)`,
          900: `var(--color-secondary-900)`,
          950: `var(--color-secondary-950)`,
        },
        'grayscale': {
           50: `var(--color-grayscale-50)`,
          100: `var(--color-grayscale-100)`,
          200: `var(--color-grayscale-200)`,
          300: `var(--color-grayscale-300)`,
          400: `var(--color-grayscale-400)`,
          500: `var(--color-grayscale-500)`,
          600: `var(--color-grayscale-600)`,
          700: `var(--color-grayscale-700)`,
          800: `var(--color-grayscale-800)`,
          900: `var(--color-grayscale-900)`,
          950: `var(--color-grayscale-950)`,
        },
        'success': {
          50:  `var(--color-success-50)`,
          100: `var(--color-success-100)`,
          200: `var(--color-success-200)`,
          300: `var(--color-success-300)`,
          400: `var(--color-success-400)`,
          500: `var(--color-success-500)`,
          600: `var(--color-success-600)`,
          700: `var(--color-success-700)`,
          800: `var(--color-success-800)`,
          900: `var(--color-success-900)`,
          950: `var(--color-success-950)`,
        },
        'warning': {
          50:  `var(--color-warning-50)`,
          100: `var(--color-warning-100)`,
          200: `var(--color-warning-200)`,
          300: `var(--color-warning-300)`,
          400: `var(--color-warning-400)`,
          500: `var(--color-warning-500)`,
          600: `var(--color-warning-600)`,
          700: `var(--color-warning-700)`,
          800: `var(--color-warning-800)`,
          900: `var(--color-warning-900)`,
          950: `var(--color-warning-950)`,
        },
        'danger': {
          50:  `var(--color-danger-50)`,
          100: `var(--color-danger-100)`,
          200: `var(--color-danger-200)`,
          300: `var(--color-danger-300)`,
          400: `var(--color-danger-400)`,
          500: `var(--color-danger-500)`,
          600: `var(--color-danger-600)`,
          700: `var(--color-danger-700)`,
          800: `var(--color-danger-800)`,
          900: `var(--color-danger-900)`,
          950: `var(--color-danger-950)`,
        },
        'borderError': `var(--color-input-border-error)`,
        'border': {
          'error': `var(--color-input-border-error)`,
        }

      },
      borderColor: theme => ({
        enabled: `var(--color-input-border-enabled)`,
        disabled: `var(--color-input-border-disabled)`,
        focus: `var(--color-input-border-focus)`,
        error: `var(--color-input-border-error)`
      }),
      outlineColor: theme => ({
        enabled: `var(--color-input-border-enabled)`,
        disabled: `var(--color-input-border-disabled)`,
        focus: `var(--color-input-border-focus)`,
        error: `var(--color-input-border-error)`
      }),
      ringColor: theme => ({
        enabled: `var(--color-input-border-enabled)`,
        disabled: `var(--color-input-border-disabled)`,
        focus: `var(--color-input-border-focus)`,
        error: `var(--color-input-border-error)`
      }),
      textColor: theme => ({
        enabled: `var(--color-input-text-enabled)`,
        disabled: `var(--color-input-text-disabled)`,
        focus: `var(--color-input-text-focus)`,
        error: `var(--color-input-text-error)`
      }),
      backgroundColor: theme => ({
        enabled: `var(--color-input-bg-enabled)`,
        disabled: `var(--color-input-bg-disabled)`,
        focus: `var(--color-input-bg-focus)`,
        error: `var(--color-input-bg-error)`
      }),
    },
  },
  plugins: [],
}

