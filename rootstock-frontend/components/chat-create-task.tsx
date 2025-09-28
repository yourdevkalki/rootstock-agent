"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowUp, MessageCircle, Sparkles, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet"
import { ethers } from "ethers"
import { appendToChatHistory } from "./chat-history"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Define a global interface for the window.ethereum object
declare global {
  interface Window {
    ethereum?: any;
  }
}

const SUGGESTIONS = [
  "Every day at 9am swap 50 USDC to ETH",
  "When BTC rises above $70000, swap 1000 USDC to BTC",
  "DCA 10 USDC to RBTC every 6 hours",
]

// Sequential loading messages with timing
const LOADING_SEQUENCE = [
  { message: "🚀 Task creation started...", delay: 0 },
  { message: "🧠 Processing natural language with AI...", delay: 4000 },
  { message: "🔍 Analyzing your automation request...", delay: 8000 },
  { message: "⚙️ Setting up smart contract parameters...", delay: 12000 },
  { message: "🔗 Deploying task on blockchain...", delay: 16000 },
  { message: "✅ Finalizing transaction...", delay: 20000 },
]

type HistoryItem = {
  id: string
  userPrompt: string
  assistantResponse: string
  createdAt: number
}

export function ChatCreateTask({ 
  input, 
  setInput,
  selectedHistoryItem,
  onClearHistory
}: { 
  input: string; 
  setInput: (value: string) => void;
  selectedHistoryItem?: HistoryItem | null;
  onClearHistory?: () => void;
}) {
  const { address } = useWallet()
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; suggestion?: any; }[]>([
    {
      role: "assistant",
      content:
        "Tell me what you want to automate. I can schedule swaps by time or trigger them when a price crosses a threshold.",
    },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState<any>(null)
  const [userChoice, setUserChoice] = useState<string>('')
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasUserMessage = messages.some((m) => m.role === "user")

  // Load history item when selected
  useEffect(() => {
    if (selectedHistoryItem) {
      setMessages([
        {
          role: "assistant",
          content:
            "Tell me what you want to automate. I can schedule swaps by time or trigger them when a price crosses a threshold.",
        },
        { role: "user", content: selectedHistoryItem.userPrompt },
        { role: "assistant", content: selectedHistoryItem.assistantResponse },
      ])
      setInput("") // Clear input when loading history
    }
  }, [selectedHistoryItem, setInput])

  // Reset to initial state when starting new conversation
  const resetToInitialState = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Tell me what you want to automate. I can schedule swaps by time or trigger them when a price crosses a threshold.",
      },
    ])
    onClearHistory?.()
  }

  // Function to display sequential loading messages
  const startLoadingSequence = () => {
    setCurrentLoadingStep(0)
    
    LOADING_SEQUENCE.forEach((step, index) => {
      setTimeout(() => {
        setCurrentLoadingStep(index)
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Remove previous loading message
          { role: "assistant", content: step.message },
        ])
      }, step.delay)
    })
  }

  async function handleSuggestionChoice(choice: 'accept' | 'reject', suggestionData: any) {
    const instructionToCreate = choice === 'accept' ? suggestionData.suggestion.instruction : suggestionData.originalInstruction;
    const userResponseText = choice === 'accept' ? "Sounds good, use the suggestion." : "No thanks, I'll use my own strategy.";

    // Remove the suggestion from the message to hide the buttons
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.suggestion) {
          const { suggestion, ...rest } = msg;
          return rest;
        }
        return msg;
      })
    );

    // Add user's choice to the chat history before creating the task
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: userResponseText },
    ]);

    // A short delay to let the user see their choice before the loading sequence starts
    setTimeout(() => {
      createTask(instructionToCreate);
    }, 500);
  }

  async function createTask(instruction: string, approvalTxHash?: string) {
    console.log("createTask called with instruction:", instruction)
    setSubmitting(true)

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: "🚀 Task creation started..." },
    ])

    startLoadingSequence();


    try {
      const payload = { instruction, userAddress: address, approvalTxHash };
      console.log("Sending payload:", payload)
      
      const res = await fetch(`${API_URL}/natural-language/create-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorBody = await res.json()
        console.error("API Error:", errorBody)
        throw new Error(errorBody.error || "An unknown error occurred")
      }

      const responseData = await res.json();
      console.log("Success response:", responseData);

      // --- Handle Approval Flow ---
      if (responseData.needsApproval) {
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Remove loading message
          {
            role: "assistant",
            content: "Your approval is required to perform this swap. Please confirm the transaction in your wallet.",
          },
        ]);

        try {
          if (!window.ethereum) {
            throw new Error("MetaMask is not installed. Please install it to continue.");
          }
          const { tokenToApprove, amount, spender } = responseData;
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const tokenContract = new ethers.Contract(tokenToApprove, [
            'function approve(address spender, uint256 amount) public returns (bool)'
          ], signer);

          // Convert amount to the correct unit (assuming 18 decimals)
          const amountInWei = ethers.parseUnits(amount.toString(), 18);

          const approveTx = await tokenContract.approve(spender, amountInWei);

          setMessages((prevMessages) => [
            ...prevMessages,
            {
              role: "assistant",
              content: `⏳ Waiting for approval transaction to be confirmed...\nTransaction Hash: ${approveTx.hash}`,
            },
          ]);

          await approveTx.wait(); // Wait for the transaction to be mined

          // Now that approval is done, call createTask again with the approval hash
          await createTask(instruction, approveTx.hash);

        } catch (approvalError: any) {
          console.error("Approval Error:", approvalError);
          const errorMessage = `Approval failed: ${approvalError.message}`;
          setMessages((prevMessages) => [
            ...prevMessages.slice(0, -1),
            { role: "assistant", content: errorMessage },
          ]);
          setSubmitting(false);
        }
        return; // Stop further execution in this run
      }
      // --- End Handle Approval Flow ---

      const { taskId, transactionHash, message } = responseData;

      // Success message with transaction hash
      const successMessage = `🎉 Congratulations! Your task has been successfully created on-chain!\n\n Transaction Hash: ${transactionHash}\n\n✅ Your automation is now live and will execute according to your specified conditions.`
      
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1), // Remove loading message
        {
          role: "assistant",
          content: successMessage,
        },
      ])

      // Store in chat history with both prompt and response
      appendToChatHistory(instruction, successMessage)

      toast.success("🎉 Automation Created Successfully!", {
        description: message,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://explorer.testnet.rootstock.io/tx/${transactionHash}`, "_blank"),
        },
      })

    } catch (err: any) {
      console.error("Error creating task:", err)
      
      const errorMessage = "❌ Something went wrong while creating your task. Please check your wallet connection and try again."
      
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1), // Remove loading message
        {
          role: "assistant",
          content: errorMessage,
        },
      ])

      // Store error in history too
      appendToChatHistory(instruction, errorMessage)
      
      toast.error("Failed to create task", {
        description: err?.message ?? "Unknown error",
      })
    } finally {
      setSubmitting(false)
      setCurrentLoadingStep(0)
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    console.log("handleSubmit called with input:", input)
    
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const text = input.trim()
    if (!text) {
      console.log("No text provided, returning early")
      return
    }

    if (!address) {
      console.log("No wallet address, showing error message")
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Please connect your wallet before creating a task.",
        },
      ])
      return
    }

    console.log("Starting API call...")
    setSubmitting(true)
    setInput("") // Clear input immediately

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: text },
    ]);

    try {
      const suggestionRes = await fetch(`${API_URL}/natural-language/suggest-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: text }),
      });

      if (!suggestionRes.ok) {
        console.error('Suggestion endpoint failed. Creating task directly.');
        await createTask(text);
        return;
      }

      const suggestionData = await suggestionRes.json();
      console.log("Suggestion data:", suggestionData)

      if (suggestionData.suggestion) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            content: suggestionData.suggestion.humanReadable,
            suggestion: suggestionData,
          },
        ]);
        setSubmitting(false);
      } else {
        await createTask(text);
      }
    } catch (err: any) {
      console.error("Error in suggestion/creation flow:", err);
      const errorMessage = "❌ Something went wrong. Please try again.";
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
      setSubmitting(false);
    }
  }

  // Handle button click separately to ensure it works
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("Button clicked")
    e.preventDefault()
    handleSubmit()
  }

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    console.log("Form submitted")
    handleSubmit(e)
  }

  function applySuggestion(s: string) {
    if (submitting) return // Don't allow changes during submission
    setInput(s)
    inputRef.current?.focus()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {selectedHistoryItem && (
        <div className="flex justify-center">
          <button
            onClick={resetToInitialState}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground/80 hover:bg-accent"
          >
            Start New Conversation
          </button>
        </div>
      )}
      
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Natural-language automation
        </span>
      </div>


      {hasUserMessage && (
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className="flex">
                {m.role === "assistant" ? (
                  <div className="ml-0 mr-auto max-w-[80%] rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm">
                    <div className="mb-1 flex items-center gap-2 text-foreground/70">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs">Assistant</span>
                      {submitting && i === messages.length - 1 && (
                        <div className="ml-2 h-3 w-3 animate-pulse rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="text-foreground/90 whitespace-pre-line">
                      {m.content}

                      {/* Render suggestion buttons if they exist on the message */}
                      {m.suggestion && (
                        <div className="mt-4 flex justify-center gap-4">
                          <Button onClick={() => handleSuggestionChoice('accept', m.suggestion)}>Accept Suggestion</Button>
                          <Button variant="outline" onClick={() => handleSuggestionChoice('reject', m.suggestion)}>Use My Own</Button>
                        </div>
                      )}

                      {/* Show transaction link if this is a success message with txHash */}
                      {m.content.includes("Transaction Hash:") && (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => {
                              const transactionHashMatch = m.content.match(/Transaction Hash: ([a-fA-F0-9x]+)/)
                              const transactionHash = transactionHashMatch?.[1]
                              console.log(transactionHash)
                              if (transactionHash) {
                                window.open(`https://explorer.testnet.rootstock.io/tx/${transactionHash}`, "_blank")
                              }
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on Explorer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ml-auto mr-0 max-w-[80%] rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                    <p className="text-foreground">{m.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="relative" aria-label="Create task with chat">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 ring-1 ring-primary/20 focus-within:ring-primary/40">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => !submitting && setInput(e.target.value)} // Disable during submission
            placeholder={submitting ? "Processing your request..." : "Ask anything about trading..."}
            className="w-full bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none"
            aria-label="Chat input"
            disabled={submitting} // Disable input during submission
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !submitting) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button 
            type="button"
            onClick={handleButtonClick}
            className="rounded-full" 
            disabled={!input.trim() || submitting} 
            aria-label={submitting ? "Processing..." : "Send"}
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-foreground/60">
        Examples: "Every 6 hours swap 10 USDC to ETH" · "When BTC rises above $70,000, swap 1,000 USDC to BTC"
      </p>

      <div className="flex items-center gap-2 overflow-x-auto">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applySuggestion(s)}
            disabled={submitting} // Disable suggestions during submission
            className="shrink-0 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}