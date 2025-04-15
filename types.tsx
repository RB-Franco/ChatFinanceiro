export interface Transaction {
  id: string
  description: string
  amount: number
  date: Date
  category: string
  subcategory?: string
  type: "receita" | "despesa"
  status: "realizada" | "futura"
  family_code?: string
  user_id?: string
}
