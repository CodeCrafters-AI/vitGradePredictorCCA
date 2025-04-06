"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GradePredictor from "@/components/grade-predictor"
import CgpaCalculator from "@/components/cgpa-calculator"
import { Footer } from "@/components/footer"
import { LoadingScreen } from "@/components/loading-screen"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <LoadingScreen />
      <div className="flex min-h-screen flex-col">
        <main className="container mx-auto flex-1 py-8 px-4">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text">
            VIT GRADE PREDICTOR
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Predict your grades and calculate your CGPA with ease
          </p>

          <Tabs defaultValue="grade-predictor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="grade-predictor">Grade Predictor</TabsTrigger>
              <TabsTrigger value="cgpa-calculator">CGPA Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="grade-predictor">
              <GradePredictor />
            </TabsContent>

            <TabsContent value="cgpa-calculator">
              <CgpaCalculator />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  )
}

