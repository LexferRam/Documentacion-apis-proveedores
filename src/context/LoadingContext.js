'use client'

import { createContext, useContext, useState } from 'react'

export const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {

    const [loading, setLoading] = useState(false)

    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}
        </LoadingContext.Provider>
    )
}

export const useLoadingProvider = () =>useContext(LoadingContext)