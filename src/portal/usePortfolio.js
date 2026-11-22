import { useOutletContext } from 'react-router-dom'

// PortfolioLayout ke andar ke pages mein: const { portfolio } = usePortfolio()
export const usePortfolio = () => useOutletContext()
