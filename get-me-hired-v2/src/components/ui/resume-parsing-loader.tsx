"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";

interface ResumeParsingLoaderProps {
  stage: "uploading" | "extracting" | "parsing" | "validating" | "complete";
}

export function ResumeParsingLoader({ stage }: ResumeParsingLoaderProps) {
  const stages = [
    { key: "uploading", label: "Uploading resume", icon: FileText },
    { key: "extracting", label: "Extracting text", icon: FileText },
    { key: "parsing", label: "Parsing with AI", icon: Sparkles },
    { key: "validating", label: "Validating data", icon: CheckCircle2 },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Main Animation Circle */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/20"
          style={{ width: 120, height: 120 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle pulsing ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-primary/40"
          style={{ width: 112, height: 112 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner circle with icon */}
        <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm" style={{ width: 120, height: 120 }}>
          <motion.div
            key={stage} // Force re-mount on stage change to reset animations
            initial={{ scale: 1, rotate: 0 }}
            animate={{
              scale: stage === "complete" ? 1.2 : [1, 1.2, 1],
              rotate: stage === "parsing" ? [0, 360] : 0
            }}
            transition={{
              scale: stage === "complete"
                ? { duration: 0.3, ease: "easeOut" }
                : { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2, repeat: stage === "parsing" ? Infinity : 0, ease: "linear" }
            }}
          >
            {stage === "uploading" && <FileText className="w-12 h-12 text-primary" />}
            {stage === "extracting" && <FileText className="w-12 h-12 text-primary" />}
            {stage === "parsing" && <Sparkles className="w-12 h-12 text-primary" />}
            {stage === "validating" && <CheckCircle2 className="w-12 h-12 text-primary" />}
            {stage === "complete" && <CheckCircle2 className="w-12 h-12 text-green-500" />}
          </motion.div>
        </div>

        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -4,
              marginLeft: -4,
            }}
            animate={{
              x: [
                0,
                Math.cos((i * 120 * Math.PI) / 180) * 60,
                Math.cos(((i * 120 + 360) * Math.PI) / 180) * 60,
                0,
              ],
              y: [
                0,
                Math.sin((i * 120 * Math.PI) / 180) * 60,
                Math.sin(((i * 120 + 360) * Math.PI) / 180) * 60,
                0,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Stage Labels */}
      <div className="space-y-3 w-full max-w-sm">
        {stages.map((stageItem, index) => {
          const Icon = stageItem.icon;
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;

          return (
            <motion.div
              key={stageItem.key}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : isComplete
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-muted/50"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`flex-shrink-0 ${isComplete ? "text-green-500" : isActive ? "text-primary" : "text-muted-foreground"}`}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-sm font-medium ${isActive ? "text-foreground" : isComplete ? "text-green-500" : "text-muted-foreground"}`}>
                {stageItem.label}
              </span>
              {isActive && (
                <motion.div
                  className="ml-auto flex gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: "0.4s" }} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Status Text */}
      <motion.p
        className="text-sm text-muted-foreground text-center max-w-md"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {stage === "uploading" && "Uploading your resume securely..."}
        {stage === "extracting" && "Extracting text from your PDF..."}
        {stage === "parsing" && "AI is analyzing your experience and skills..."}
        {stage === "validating" && "Validating extracted data for accuracy..."}
        {stage === "complete" && "Resume parsed successfully!"}
      </motion.p>
    </div>
  );
}
