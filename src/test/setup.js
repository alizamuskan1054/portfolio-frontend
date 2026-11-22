import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Har test ke baad render kiya hua DOM saaf karo.
afterEach(() => cleanup())
