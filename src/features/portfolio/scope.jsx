/* eslint-disable react-refresh/only-export-components */
// Admin aur client portal ek hi section forms (list + add/edit pages) istemal karte hain.
// Farq sirf URLs ka hai: scope batata hai ke "item page" aur "wapas list" ka link kahan jaye.
// Provider na ho to admin ka scope maana jata hai, isliye admin pehle jaisa chalta hai.

import { createContext, useContext } from 'react'
import { paths } from '@/routes/paths'

export const adminScope = {
  area: 'admin',
  // item = 'new' ya record id
  itemPath: (portfolioId, section, item) =>
    `${paths.adminPortfolioEdit(portfolioId)}/${section}/${item}`,
  // step: 3 = academic, 4 = content (wizard ke steps)
  listPath: (portfolioId, { step, tab }) =>
    `${paths.adminPortfolioEdit(portfolioId)}?step=${step}&tab=${tab}`,
  homePath: (portfolioId) => paths.adminPortfolioEdit(portfolioId),
}

export const portalScope = {
  area: 'portal',
  itemPath: (portfolioId, section, item) =>
    `${paths.portalPortfolio(portfolioId)}/items/${section}/${item}`,
  listPath: (portfolioId, { step, tab }) =>
    `${paths.portalPortfolio(portfolioId)}/${step === 3 ? 'academic' : 'content'}?tab=${tab}`,
  homePath: (portfolioId) => paths.portalPortfolio(portfolioId),
}

const PortfolioScopeContext = createContext(adminScope)

export function PortfolioScopeProvider({ scope, children }) {
  return (
    <PortfolioScopeContext.Provider value={scope}>
      {children}
    </PortfolioScopeContext.Provider>
  )
}

export const usePortfolioScope = () => useContext(PortfolioScopeContext)
