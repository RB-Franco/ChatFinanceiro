"use client"

import type React from "react"

import { useState, useRef, useEffect, createContext, useContext } from "react"
import { MessageSquare, Send, PanelLeft, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useFinance, type TransactionType } from "./finance-provider"
import { formatCurrency } from "@/utils/format-currency"
import { LoadingOverlay } from "./loading-overlay"

// Criar um contexto específico para o chat sidebar
interface ChatSidebarContext {
  state: "expanded" | "collapsed"
  toggleSidebar: () => void
}

const ChatSidebarContext = createContext<ChatSidebarContext | null>(null)

function useChatSidebar() {
  const context = useContext(ChatSidebarContext)
  if (!context) {
    throw new Error("useChatSidebar must be used within a ChatSidebarProvider")
  }
  return context
}

// Provider para o contexto do chat sidebar
export function ChatSidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"expanded" | "collapsed">("collapsed")

  const toggleSidebar = () => {
    setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"))
  }

  return <ChatSidebarContext.Provider value={{ state, toggleSidebar }}>{children}</ChatSidebarContext.Provider>
}

interface Message {
  id: string
  text: string
  sender: "user" | "system"
  timestamp: Date
}

// Chave para armazenar mensagens no localStorage
const STORAGE_KEY = "finance-chat-messages"

// Adicionar classe para aumentar o z-index do chat sidebar

export function FinanceChat() {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(true)
  const [processingMessage, setProcessingMessage] = useState(false)

  // Usar o contexto do chat sidebar
  const { state: sidebarState, toggleSidebar } = useChatSidebar()
  const isCollapsed = sidebarState === "collapsed"

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { addTransaction, isProcessingTransaction, showFamilyTransactions } = useFinance()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Resto do código...

  // Carregar mensagens do localStorage
  useEffect(() => {
    if (!mounted) return

    try {
      setChatLoading(true)

      // Carregar do localStorage
      const savedMessages = localStorage.getItem(STORAGE_KEY)
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages)
          // Converter strings de data para objetos Date
          const withDates = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
          setMessages(withDates)
        } catch (e) {
          console.error("Erro ao carregar mensagens do localStorage:", e)

          // Adicionar mensagem de boas-vindas local em caso de erro
          const welcomeMsg = {
            id: "welcome",
            text: "Olá! Envie suas transações financeiras no formato: [tipo: receita/despesa] [valor] [categoria] [subcategoria] [descrição] [data opcional: DD/MM/AAAA]. Exemplo: receita 100 salário mensal Pagamento de janeiro",
            sender: "system",
            timestamp: new Date(),
          }
          setMessages([welcomeMsg])

          // Salvar no localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify([welcomeMsg]))
        }
      } else {
        // Adicionar mensagem de boas-vindas local se não houver mensagens salvas
        const welcomeMsg = {
          id: "welcome",
          text: "Olá! Envie suas transações financeiras no formato: [tipo: receita/despesa] [valor] [categoria] [subcategoria] [descrição] [data opcional: DD/MM/AAAA]. Exemplo: receita 100 salário mensal Pagamento de janeiro",
          sender: "system",
          timestamp: new Date(),
        }
        setMessages([welcomeMsg])

        // Salvar no localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify([welcomeMsg]))
      }
    } finally {
      // Pequeno delay para evitar flash de loading
      setTimeout(() => {
        setChatLoading(false)
      }, 300)
    }
  }, [mounted])

  // Salvar mensagens no localStorage quando mudar
  useEffect(() => {
    if (messages.length > 0 && mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, mounted])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const saveMessage = (message: Omit<Message, "id">): Message => {
    // Salvar apenas no localStorage
    return {
      ...message,
      id: Date.now().toString(),
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || processingMessage) return

    const userMessage: Omit<Message, "id"> = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    }

    // Limpar o input antes de processar
    const messageText = input
    setInput("")

    // Salvar mensagem do usuário
    const savedUserMessage = saveMessage(userMessage)
    setMessages((prev) => [...prev, savedUserMessage])

    // Adicionar mensagem temporária de "digitando..."
    const typingMessageId = Date.now().toString() + "-typing"
    setMessages((prev) => [
      ...prev,
      {
        id: typingMessageId,
        text: "Processando transação...",
        sender: "system" as const,
        timestamp: new Date(),
      },
    ])

    // Processar a mensagem
    try {
      setProcessingMessage(true)
      await processMessage(messageText)
    } catch (error) {
      console.error("Erro ao processar mensagem:", error)
    } finally {
      // Remover a mensagem de "digitando..."
      setMessages((prev) => prev.filter((msg) => msg.id !== typingMessageId))
      setProcessingMessage(false)
    }
  }

  // Atualizar a função processMessage para incluir o código familiar quando necessário
  const processMessage = async (message: string) => {
    try {
      // Regex para extrair informações da mensagem
      // Novo formato: [tipo] [valor] [categoria] [subcategoria] [descrição] [data opcional]
      const parts = message.trim().split(" ")

      if (parts.length < 4) {
        throw new Error(
          "Formato inválido. Use: [tipo: receita/despesa] [valor] [categoria] [subcategoria] [descrição] [data opcional: DD/MM/AAAA]. Exemplo: receita 100 salário mensal Pagamento de janeiro",
        )
      }

      const type = parts[0].toLowerCase() as TransactionType
      if (type !== "receita" && type !== "despesa") {
        throw new Error("Tipo deve ser 'receita' ou 'despesa'")
      }

      const amount = Number.parseFloat(parts[1].replace(",", "."))
      if (isNaN(amount)) {
        throw new Error("Valor inválido")
      }

      const category = parts[2].toLowerCase()
      const subcategory = parts[3]

      // Verificar se o último elemento é uma data
      let date = new Date()
      let description = parts.slice(4).join(" ")

      // Verificar se o último elemento é uma data no formato DD/MM/AAAA
      const lastPart = parts[parts.length - 1]
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
      const dateMatch = lastPart.match(dateRegex)

      if (dateMatch) {
        const [_, day, month, year] = dateMatch
        date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

        // Remover a data da descrição
        description = parts.slice(4, parts.length - 1).join(" ") || subcategory
      } else {
        description = parts.slice(4).join(" ") || subcategory
      }

      // Determinar se é uma transação futura
      const isFuture = date > new Date()

      const transactionData = {
        amount: type === "despesa" ? -Math.abs(amount) : Math.abs(amount),
        type,
        category,
        subcategory,
        description,
        date,
        status: isFuture ? "futura" : "realizada",
      }

      // Adicionar transação - aguardar a conclusão completa
      // Usar um try/catch específico para a operação de banco de dados
      try {
        // Adicionar um tempo de espera antes de iniciar a transação para garantir que a UI esteja atualizada
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Adicionar a transação e aguardar a conclusão
        await addTransaction(transactionData)

        // Aguardar um tempo adicional para garantir que todas as atualizações de estado sejam concluídas
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Resposta do sistema - só adicionar após a conclusão da transação
        const statusText = isFuture ? " (futura)" : ""
        const familyText = showFamilyTransactions ? " (compartilhada com a família)" : ""
        const responseMessage: Omit<Message, "id"> = {
          text: `Transação registrada${statusText}${familyText}: ${type === "receita" ? "+" : "-"}${formatCurrency(
            Math.abs(amount),
          )} em ${category} (${subcategory}): ${description}`,
          sender: "system",
          timestamp: new Date(),
        }

        // Salvar mensagem de resposta
        const savedResponseMessage = saveMessage(responseMessage)
        setMessages((prev) => [...prev, savedResponseMessage])

        toast({
          title: `Transação ${isFuture ? "futura" : ""} registrada`,
          description: `${type === "receita" ? "+" : "-"}${formatCurrency(Math.abs(amount))} em ${category}${
            showFamilyTransactions ? " (compartilhada com a família)" : ""
          }`,
        })
      } catch (dbError: any) {
        console.error("Erro ao salvar transação no banco de dados:", dbError)
        throw new Error(`Erro ao salvar transação: ${dbError.message}`)
      }
    } catch (error: any) {
      console.error("Erro ao processar mensagem:", error)
      const errorMessage: Omit<Message, "id"> = {
        text: `Erro: ${error.message}`,
        sender: "system",
        timestamp: new Date(),
      }

      // Salvar mensagem de erro
      const savedErrorMessage = saveMessage(errorMessage)
      setMessages((prev) => [...prev, savedErrorMessage])
    }
  }

  const renderMessage = (message: Message) => {
    if (message.id.endsWith("-typing")) {
      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span>Processando transação</span>
            <span className="typing-dot">.</span>
            <span className="typing-dot typing-dot-2">.</span>
            <span className="typing-dot typing-dot-3">.</span>
          </div>
          <div className="text-xs text-muted-foreground">Aguarde enquanto salvamos sua transação</div>
        </div>
      )
    }

    return message.text
  }

  // Renderizar nada durante a renderização do servidor
  if (!mounted) {
    return null
  }

  return (
    <div
      className={`h-full flex flex-col border-l border-border transition-all duration-300 ${isCollapsed ? "w-[3.5rem]" : "w-[20rem]"} bg-[hsl(var(--sidebar-background))] relative sidebar-container`}
    >
      {/* Loading overlay específico para o chat */}
      {chatLoading && <LoadingOverlay show={chatLoading} message="Carregando mensagens..." fullScreen={false} />}

      {/* Header */}
      <div className="h-16 border-b flex items-center px-4">
        <div className={`flex ${isCollapsed ? "justify-center" : "justify-between"} w-full`}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {!isCollapsed && <span className="text-xl font-bold">FinanceChat</span>}
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="ml-2" aria-label="Colapsar chat">
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className={`h-full ${isCollapsed ? "px-0" : "px-4"}`}>
          <div className="py-4 space-y-3">
            {!isCollapsed &&
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {renderMessage(message)}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="border-t p-2 h-16">
        {!isCollapsed ? (
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua transação..."
              className="flex-1"
              disabled={processingMessage}
            />
            <Button type="submit" size="sm" disabled={processingMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="flex justify-center items-center h-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-10 w-10 rounded-full"
              title="Expandir chat"
            >
              <PanelRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        
        .typing-dot {
          animation: blink 1.4s infinite;
          animation-fill-mode: both;
          font-weight: bold;
          font-size: 1.2em;
        }
        
        .typing-dot-2 {
          animation-delay: 0.2s;
        }
        
        .typing-dot-3 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  )
}
