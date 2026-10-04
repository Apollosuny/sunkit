import '@testing-library/jest-dom/vitest'

// Let `act()` from `react` flush updates without warnings in hand-rolled hydration tests.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
