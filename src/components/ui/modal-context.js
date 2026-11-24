import { createContext, useContext } from 'react'

// Modal ke andar FormField khud "label left, input right" layout le leta hai.
export const ModalContext = createContext(false)
export const useInModal = () => useContext(ModalContext)

// 'row' | 'stack': form ka default layout. Login jaise pages 'stack' dete hain.
export const FormLayoutContext = createContext(undefined)
export const useFormLayout = () => useContext(FormLayoutContext)
