"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type AssessmentType = "2DA1Quiz" | "1DA2Quiz"
type PredictionStage = "afterCAT1" | "afterCAT2" | "afterDA" | "afterFAT"

interface SubjectData {
  id: string
  name: string
  assessmentType: AssessmentType
  hasLab: boolean
  cat1: number
  cat1ClassAvg: number
  cat2: number
  cat2ClassAvg: number
  da1: number
  da1ClassAvg: number
  da2?: number
  da2ClassAvg?: number
  quiz1: number
  quiz1ClassAvg: number
  quiz2?: number
  quiz2ClassAvg?: number
  fat: number
  fatClassAvg: number
  labInternal?: number
  labInternalClassAvg?: number
  labFat?: number
  labFatClassAvg?: number
  predictedGrade: string
  predictedScore: number
}

const DEFAULT_SUBJECT: SubjectData = {
  id: "",
  name: "",
  assessmentType: "2DA1Quiz",
  hasLab: false,
  cat1: 0,
  cat1ClassAvg: 0,
  cat2: 0,
  cat2ClassAvg: 0,
  da1: 0,
  da1ClassAvg: 0,
  da2: 0,
  da2ClassAvg: 0,
  quiz1: 0,
  quiz1ClassAvg: 0,
  quiz2: 0,
  quiz2ClassAvg: 0,
  fat: 0,
  fatClassAvg: 0,
  labInternal: 0,
  labInternalClassAvg: 0,
  labFat: 0,
  labFatClassAvg: 0,
  predictedGrade: "",
  predictedScore: 0,
}

export default function GradePredictor() {
  const [subjects, setSubjects] = useState<SubjectData[]>([{ ...DEFAULT_SUBJECT, id: "subject-1", name: "Subject 1" }])
  const [activeSubject, setActiveSubject] = useState<string>("subject-1")
  const [predictionStage, setPredictionStage] = useState<PredictionStage>("afterFAT")
  const [expanded, setExpanded] = useState<boolean>(false)
  const { toast } = useToast()

  // Load saved subjects from localStorage on initial render only
  useEffect(() => {
    const savedSubjects = localStorage.getItem("predictedSubjects")
    if (savedSubjects) {
      try {
        const parsedSubjects = JSON.parse(savedSubjects)
        setSubjects(parsedSubjects)
      } catch (e) {
        console.error("Failed to parse saved subjects", e)
      }
    }
  }, [])

  const addSubject = () => {
    const newId = `subject-${subjects.length + 1}`
    const newSubject = {
      ...DEFAULT_SUBJECT,
      id: newId,
      name: `Subject ${subjects.length + 1}`,
    }
    setSubjects([...subjects, newSubject])
    setActiveSubject(newId)
  }

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return

    const newSubjects = subjects.filter((subject) => subject.id !== id)
    setSubjects(newSubjects)

    if (activeSubject === id) {
      setActiveSubject(newSubjects[0].id)
    }
  }

  const handleSubjectChange = (id: string, field: keyof SubjectData, value: any) => {
    setSubjects(subjects.map((subject) => (subject.id === id ? { ...subject, [field]: value } : subject)))
  }

  const calculateSubjectScore = (subject: SubjectData, stage: PredictionStage): number => {
    let totalScore = 0
    let maxScore = 0

    // CAT1 (50 marks to 15)
    if (stage === "afterCAT1" || stage === "afterCAT2" || stage === "afterDA" || stage === "afterFAT") {
      const cat1Converted = subject.cat1 > 0 ? (subject.cat1 / 50) * 15 : 0
      totalScore += cat1Converted
      maxScore += 15
    }

    // CAT2 (50 marks to 15)
    if (stage === "afterCAT2" || stage === "afterDA" || stage === "afterFAT") {
      const cat2Converted = subject.cat2 > 0 ? (subject.cat2 / 50) * 15 : 0
      totalScore += cat2Converted
      maxScore += 15
    }

    // DA and Quiz components (total 30 marks)
    if (stage === "afterDA" || stage === "afterFAT") {
      let daQuizTotal = 0
      if (subject.assessmentType === "2DA1Quiz") {
        // 2 DAs (10 marks each) and 1 Quiz (10 marks)
        daQuizTotal = (subject.da1 || 0) + (subject.da2 || 0) + (subject.quiz1 || 0)
      } else {
        // 1 DA (10 marks) and 2 Quizzes (10 marks each)
        daQuizTotal = (subject.da1 || 0) + (subject.quiz1 || 0) + (subject.quiz2 || 0)
      }
      totalScore += daQuizTotal
      maxScore += 30
    }

    // FAT (100 marks to 40)
    if (stage === "afterFAT") {
      const fatConverted = subject.fat > 0 ? (subject.fat / 100) * 40 : 0
      totalScore += fatConverted
      maxScore += 40
    }

    // If no scores are available yet, return 0
    if (maxScore === 0) return 0

    // Calculate percentage of available marks
    const percentageOfAvailable = (totalScore / maxScore) * 100

    // If lab component exists and we're at the final stage, include lab scores
    if (subject.hasLab && stage === "afterFAT") {
      const labTotal = (subject.labInternal || 0) + (subject.labFat || 0)
      return (percentageOfAvailable + labTotal) / 2 // Simple average of theory and lab
    }

    return percentageOfAvailable
  }

  const calculateClassAverage = (subject: SubjectData, stage: PredictionStage): number => {
    let totalAvg = 0
    let maxScore = 0

    // CAT1 average
    if (stage === "afterCAT1" || stage === "afterCAT2" || stage === "afterDA" || stage === "afterFAT") {
      const cat1AvgConverted = subject.cat1ClassAvg > 0 ? (subject.cat1ClassAvg / 50) * 15 : 0
      totalAvg += cat1AvgConverted
      maxScore += 15
    }

    // CAT2 average
    if (stage === "afterCAT2" || stage === "afterDA" || stage === "afterFAT") {
      const cat2AvgConverted = subject.cat2ClassAvg > 0 ? (subject.cat2ClassAvg / 50) * 15 : 0
      totalAvg += cat2AvgConverted
      maxScore += 15
    }

    // DA and Quiz averages
    if (stage === "afterDA" || stage === "afterFAT") {
      let daQuizAvgTotal = 0
      if (subject.assessmentType === "2DA1Quiz") {
        daQuizAvgTotal = (subject.da1ClassAvg || 0) + (subject.da2ClassAvg || 0) + (subject.quiz1ClassAvg || 0)
      } else {
        daQuizAvgTotal = (subject.da1ClassAvg || 0) + (subject.quiz1ClassAvg || 0) + (subject.quiz2ClassAvg || 0)
      }
      totalAvg += daQuizAvgTotal
      maxScore += 30
    }

    // FAT average
    if (stage === "afterFAT") {
      const fatAvgConverted = subject.fatClassAvg > 0 ? (subject.fatClassAvg / 100) * 40 : 0
      totalAvg += fatAvgConverted
      maxScore += 40
    }

    // If no scores are available yet, return 0
    if (maxScore === 0) return 0

    // Calculate percentage of available marks
    const avgPercentageOfAvailable = (totalAvg / maxScore) * 100

    // If lab component exists and we're at the final stage, include lab averages
    if (subject.hasLab && stage === "afterFAT") {
      const labAvgTotal = (subject.labInternalClassAvg || 0) + (subject.labFatClassAvg || 0)
      return (avgPercentageOfAvailable + labAvgTotal) / 2 // Simple average of theory and lab
    }

    return avgPercentageOfAvailable
  }

  const getPredictedGrade = (score: number, classAverage: number) => {
    // First check absolute minimum threshold for S grade
    if (score < 80) {
      // If score is below 80%, S grade is not possible regardless of class average
      // Continue with relative grading for other grades
      const diff = score - classAverage

      if (diff > 10) return "A"
      else if (diff > 5) return "B"
      else if (diff > 0) return "C"
      else if (diff > -5) return "D"
      else if (diff > -10) return "E"
      else return "F"
    } else {
      // Score is 80% or above, apply normal relative grading
      const diff = score - classAverage

      if (diff > 15) return "S"
      else if (diff > 10) return "A"
      else if (diff > 5) return "B"
      else if (diff > 0) return "C"
      else if (diff > -5) return "D"
      else if (diff > -10) return "E"
      else return "F"
    }
  }

  const calculateGrades = () => {
    // Calculate predicted grades for each subject based on current stage
    const updatedSubjects = subjects.map((subject) => {
      const score = calculateSubjectScore(subject, predictionStage)
      const classAvg = calculateClassAverage(subject, predictionStage)
      const grade = getPredictedGrade(score, classAvg)

      console.log(`Subject: ${subject.name}, Score: ${score}, Class Avg: ${classAvg}, Grade: ${grade}`)

      return {
        ...subject,
        predictedGrade: grade,
        predictedScore: score,
      }
    })

    // Update subjects with predicted grades
    setSubjects(updatedSubjects)
  }

  const saveGrades = () => {
    // First calculate the latest grades
    calculateGrades()

    // Then save to localStorage
    localStorage.setItem("predictedSubjects", JSON.stringify(subjects))

    toast({
      title: "Grades Saved",
      description: "Your predicted grades have been saved and can be used in the CGPA Calculator.",
    })
  }

  const getActiveSubject = () => {
    return subjects.find((subject) => subject.id === activeSubject) || subjects[0]
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Subject Details</CardTitle>
              <CardDescription>Enter marks and class averages for {getActiveSubject().name}</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={activeSubject} onValueChange={setActiveSubject}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeSubject(activeSubject)}
                disabled={subjects.length <= 1}
                className="sm:self-auto self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={getActiveSubject().name}
                onChange={(e) => handleSubjectChange(activeSubject, "name", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has-lab"
                checked={getActiveSubject().hasLab}
                onCheckedChange={(checked) => handleSubjectChange(activeSubject, "hasLab", checked)}
              />
              <Label htmlFor="has-lab">This subject has lab component</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="assessment-type"
                checked={getActiveSubject().assessmentType === "2DA1Quiz"}
                onCheckedChange={(checked) =>
                  handleSubjectChange(activeSubject, "assessmentType", checked ? "2DA1Quiz" : "1DA2Quiz")
                }
              />
              <Label htmlFor="assessment-type">
                {getActiveSubject().assessmentType === "2DA1Quiz" ? "2 DA + 1 Quiz" : "1 DA + 2 Quizzes"}
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <Label>Prediction Stage</Label>
              <Select value={predictionStage} onValueChange={(value) => setPredictionStage(value as PredictionStage)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Prediction Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="afterCAT1">After CAT 1</SelectItem>
                  <SelectItem value="afterCAT2">After CAT 2</SelectItem>
                  <SelectItem value="afterDA">After DA/Quiz</SelectItem>
                  <SelectItem value="afterFAT">After FAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
              {expanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Hide Detailed Inputs
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show Detailed Inputs
                </>
              )}
            </Button>

            {expanded && (
              <Tabs defaultValue="cat" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cat">CAT</TabsTrigger>
                  <TabsTrigger value="da-quiz">DA & Quiz</TabsTrigger>
                  <TabsTrigger value="fat-lab">FAT & Lab</TabsTrigger>
                </TabsList>

                <TabsContent value="cat" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cat1">CAT 1 (out of 50)</Label>
                        <Input
                          id="cat1"
                          type="number"
                          min="0"
                          max="50"
                          value={getActiveSubject().cat1 || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "cat1", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cat1-avg">CAT 1 Class Average</Label>
                        <Input
                          id="cat1-avg"
                          type="number"
                          min="0"
                          max="50"
                          value={getActiveSubject().cat1ClassAvg || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "cat1ClassAvg", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cat2">CAT 2 (out of 50)</Label>
                        <Input
                          id="cat2"
                          type="number"
                          min="0"
                          max="50"
                          value={getActiveSubject().cat2 || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "cat2", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cat2-avg">CAT 2 Class Average</Label>
                        <Input
                          id="cat2-avg"
                          type="number"
                          min="0"
                          max="50"
                          value={getActiveSubject().cat2ClassAvg || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "cat2ClassAvg", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="da-quiz" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="da1">DA 1 (out of 10)</Label>
                        <Input
                          id="da1"
                          type="number"
                          min="0"
                          max="10"
                          value={getActiveSubject().da1 || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "da1", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="da1-avg">DA 1 Class Average</Label>
                        <Input
                          id="da1-avg"
                          type="number"
                          min="0"
                          max="10"
                          value={getActiveSubject().da1ClassAvg || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "da1ClassAvg", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    {getActiveSubject().assessmentType === "2DA1Quiz" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="da2">DA 2 (out of 10)</Label>
                          <Input
                            id="da2"
                            type="number"
                            min="0"
                            max="10"
                            value={getActiveSubject().da2 || ""}
                            onChange={(e) =>
                              handleSubjectChange(activeSubject, "da2", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="da2-avg">DA 2 Class Average</Label>
                          <Input
                            id="da2-avg"
                            type="number"
                            min="0"
                            max="10"
                            value={getActiveSubject().da2ClassAvg || ""}
                            onChange={(e) =>
                              handleSubjectChange(activeSubject, "da2ClassAvg", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quiz1">Quiz 1 (out of 10)</Label>
                        <Input
                          id="quiz1"
                          type="number"
                          min="0"
                          max="10"
                          value={getActiveSubject().quiz1 || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "quiz1", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quiz1-avg">Quiz 1 Class Average</Label>
                        <Input
                          id="quiz1-avg"
                          type="number"
                          min="0"
                          max="10"
                          value={getActiveSubject().quiz1ClassAvg || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "quiz1ClassAvg", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    {getActiveSubject().assessmentType === "1DA2Quiz" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="quiz2">Quiz 2 (out of 10)</Label>
                          <Input
                            id="quiz2"
                            type="number"
                            min="0"
                            max="10"
                            value={getActiveSubject().quiz2 || ""}
                            onChange={(e) =>
                              handleSubjectChange(activeSubject, "quiz2", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quiz2-avg">Quiz 2 Class Average</Label>
                          <Input
                            id="quiz2-avg"
                            type="number"
                            min="0"
                            max="10"
                            value={getActiveSubject().quiz2ClassAvg || ""}
                            onChange={(e) =>
                              handleSubjectChange(
                                activeSubject,
                                "quiz2ClassAvg",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="fat-lab" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fat">FAT (out of 100)</Label>
                        <Input
                          id="fat"
                          type="number"
                          min="0"
                          max="100"
                          value={getActiveSubject().fat || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "fat", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fat-avg">FAT Class Average</Label>
                        <Input
                          id="fat-avg"
                          type="number"
                          min="0"
                          max="100"
                          value={getActiveSubject().fatClassAvg || ""}
                          onChange={(e) =>
                            handleSubjectChange(activeSubject, "fatClassAvg", Number.parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    {getActiveSubject().hasLab && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="lab-internal">Lab Internal (out of 60)</Label>
                            <Input
                              id="lab-internal"
                              type="number"
                              min="0"
                              max="60"
                              value={getActiveSubject().labInternal || ""}
                              onChange={(e) =>
                                handleSubjectChange(
                                  activeSubject,
                                  "labInternal",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="lab-internal-avg">Lab Internal Class Average</Label>
                            <Input
                              id="lab-internal-avg"
                              type="number"
                              min="0"
                              max="60"
                              value={getActiveSubject().labInternalClassAvg || ""}
                              onChange={(e) =>
                                handleSubjectChange(
                                  activeSubject,
                                  "labInternalClassAvg",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="lab-fat">Lab FAT (out of 40)</Label>
                            <Input
                              id="lab-fat"
                              type="number"
                              min="0"
                              max="40"
                              value={getActiveSubject().labFat || ""}
                              onChange={(e) =>
                                handleSubjectChange(activeSubject, "labFat", Number.parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="lab-fat-avg">Lab FAT Class Average</Label>
                            <Input
                              id="lab-fat-avg"
                              type="number"
                              min="0"
                              max="40"
                              value={getActiveSubject().labFatClassAvg || ""}
                              onChange={(e) =>
                                handleSubjectChange(
                                  activeSubject,
                                  "labFatClassAvg",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <Button variant="outline" onClick={addSubject} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
          <Button onClick={calculateGrades} className="w-full sm:w-auto">
            Calculate Grades
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Grade Prediction</CardTitle>
          <CardDescription>Predicted grades for all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md gap-2"
                >
                  <div>
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">Score: {subject.predictedScore.toFixed(1)}%</p>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <Badge variant={subject.predictedGrade === "F" ? "destructive" : "outline"} className="text-lg">
                      {subject.predictedGrade || "-"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={saveGrades}>
            <Save className="mr-2 h-4 w-4" />
            Save Grades for CGPA Calculation
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Grade Scale Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Relative Grading Scale</h3>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>S Grade:</span>
                  <span>&gt;15 points above average and minimum 80%</span>
                </li>
                <li className="flex justify-between">
                  <span>A Grade:</span>
                  <span>10-15 points above average</span>
                </li>
                <li className="flex justify-between">
                  <span>B Grade:</span>
                  <span>5-10 points above average</span>
                </li>
                <li className="flex justify-between">
                  <span>C Grade:</span>
                  <span>0-5 points above average</span>
                </li>
                <li className="flex justify-between">
                  <span>D Grade:</span>
                  <span>0-5 points below average</span>
                </li>
                <li className="flex justify-between">
                  <span>E Grade:</span>
                  <span>5-10 points below average</span>
                </li>
                <li className="flex justify-between">
                  <span>F Grade:</span>
                  <span>&gt;10 points below average</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Grade Points</h3>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between">
                  <span>S Grade:</span>
                  <span>10 points</span>
                </li>
                <li className="flex justify-between">
                  <span>A Grade:</span>
                  <span>9 points</span>
                </li>
                <li className="flex justify-between">
                  <span>B Grade:</span>
                  <span>8 points</span>
                </li>
                <li className="flex justify-between">
                  <span>C Grade:</span>
                  <span>7 points</span>
                </li>
                <li className="flex justify-between">
                  <span>D Grade:</span>
                  <span>6 points</span>
                </li>
                <li className="flex justify-between">
                  <span>E Grade:</span>
                  <span>5 points</span>
                </li>
                <li className="flex justify-between">
                  <span>F Grade:</span>
                  <span>0 points</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

