import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { DEFAULT_SETTINGS } from '../lib/constants'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [financeRecords, setFinanceRecords] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState({ products: false, sales: false, settings: false, financeRecords: false })

  useEffect(() => {
    if (!user) {
      setProducts([])
      setSales([])
      setFinanceRecords([])
      setSettings(DEFAULT_SETTINGS)
      setLoaded({ products: false, sales: false, settings: false, financeRecords: false })
      return undefined
    }

    setLoaded({ products: false, sales: false, settings: false, financeRecords: false })

    const unsubscribers = [
      api.subscribeProducts((items) => {
        setProducts(items)
        setLoaded((prev) => ({ ...prev, products: true }))
      }),
      api.subscribeSales((items) => {
        setSales(items)
        setLoaded((prev) => ({ ...prev, sales: true }))
      }),
      api.subscribeFinanceRecords?.((items) => {
        setFinanceRecords(items || [])
        setLoaded((prev) => ({ ...prev, financeRecords: true }))
      }),
      api.subscribeSettings((value) => {
        setSettings({ ...DEFAULT_SETTINGS, ...value })
        setLoaded((prev) => ({ ...prev, settings: true }))
      }),
    ]

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.())
  }, [user?.uid])

  const value = useMemo(
    () => ({
      products,
      sales,
      financeRecords,
      settings,
      loadingProducts: !loaded.products,
      loadingSales: !loaded.sales,
      loadingFinanceRecords: !loaded.financeRecords,
      loadingSettings: !loaded.settings,
      loading: !loaded.products || !loaded.sales,
    }),
    [products, sales, financeRecords, settings, loaded],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore harus dipakai di dalam StoreProvider')
  return context
}
