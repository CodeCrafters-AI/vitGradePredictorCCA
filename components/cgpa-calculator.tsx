"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, Trash2, Download, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface SubjectGrade {
  id: string
  name: string
  credits: number
  grade: string
}

const GRADE_POINTS: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
}

export default function CgpaCalculator() {
  const [subjects, setSubjects] = useState<SubjectGrade[]>([
    { id: "subject-1", name: "Subject 1", credits: 3, grade: "A" },
  ])
  const [cgpa, setCgpa] = useState<number>(0)
  const { toast } = useToast()

  // Only calculate CGPA on initial render and when manually triggered
  useEffect(() => {
    // Initial calculation
    calculateCGPA()
  }, [])

  const addSubject = () => {
    const newId = `subject-${subjects.length + 1}`
    setSubjects([
      ...subjects,
      {
        id: newId,
        name: `Subject ${subjects.length + 1}`,
        credits: 3,
        grade: "A",
      },
    ])
  }

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return
    setSubjects(subjects.filter((subject) => subject.id !== id))
  }

  const handleSubjectChange = (id: string, field: keyof SubjectGrade, value: any) => {
    setSubjects(subjects.map((subject) => (subject.id === id ? { ...subject, [field]: value } : subject)))
  }

  const calculateCGPA = () => {
    let totalCredits = 0
    let totalGradePoints = 0

    subjects.forEach((subject) => {
      const gradePoint = GRADE_POINTS[subject.grade] || 0
      totalGradePoints += gradePoint * subject.credits
      totalCredits += subject.credits
    })

    const calculatedCGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0
    setCgpa(Number.parseFloat(calculatedCGPA.toFixed(2)))
  }

  const loadPredictedGrades = () => {
    const savedSubjects = localStorage.getItem("predictedSubjects")
    if (!savedSubjects) {
      toast({
        title: "No Saved Grades",
        description: "No predicted grades found. Please predict grades first or add subjects manually.",
        variant: "destructive",
      })
      return
    }

    try {
      const parsedSubjects = JSON.parse(savedSubjects)
      const formattedSubjects = parsedSubjects.map((subject: any, index: number) => ({
        id: `subject-${index + 1}`,
        name: subject.name,
        credits: 3, // Default credits
        grade: subject.predictedGrade,
      }))

      setSubjects(formattedSubjects)
      // Calculate CGPA after loading subjects
      setTimeout(() => {
        calculateCGPA()
      }, 0)

      toast({
        title: "Grades Loaded",
        description: `Loaded ${formattedSubjects.length} subjects from predicted grades.`,
      })
    } catch (e) {
      console.error("Failed to parse saved subjects", e)
      toast({
        title: "Error Loading Grades",
        description: "Failed to load predicted grades. Please try again.",
        variant: "destructive",
      })
    }
  }

  const exportCGPA = () => {
    const data = {
      subjects,
      cgpa,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cgpa-calculation.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "CGPA Exported",
      description: "Your CGPA calculation has been exported as JSON.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CGPA Calculator</CardTitle>
          <CardDescription>Calculate your CGPA based on grades and credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Your CGPA</h3>
                <Badge variant="outline" className="text-lg">
                  {cgpa.toFixed(2)}
                </Badge>
              </div>
              <Progress value={cgpa * 10} className="h-3 mb-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Button variant="outline" className="w-full" onClick={loadPredictedGrades}>
                  <Upload className="mr-2 h-4 w-4" />
                  Load Predicted Grades
                </Button>
                <Button variant="outline" className="w-full" onClick={exportCGPA}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CGPA
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Grade Points Reference</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(GRADE_POINTS).map(([grade, points]) => (
                    <Badge key={grade} variant="outline" className="flex justify-between">
                      <span>{grade}</span>
                      <span>{points}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Subjects</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="p-3 border rounded-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <div className="grid gap-2 flex-1 w-full">
                        <Label htmlFor={`${subject.id}-name`}>Subject Name</Label>
                        <Input
                          id={`${subject.id}-name`}
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(subject.id, "name", e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-6 self-end sm:self-auto"
                        onClick={() => removeSubject(subject.id)}
                        disabled={subjects.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`${subject.id}-credits`}>Credits</Label>
                        <Input
                          id={`${subject.id}-credits`}
                          type="number"
                          min="1"
                          max="5"
                          value={subject.credits}
                          onChange={(e) =>
                            handleSubjectChange(subject.id, "credits", Number.parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`${subject.id}-grade`}>Grade</Label>
                        <Select
                          value={subject.grade}
                          onValueChange={(value) => handleSubjectChange(subject.id, "grade", value)}
                        >
                          <SelectTrigger id={`${subject.id}-grade`}>
                            <SelectValue placeholder="Select Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(GRADE_POINTS).map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={addSubject}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={calculateCGPA}>
            Calculate CGPA
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

