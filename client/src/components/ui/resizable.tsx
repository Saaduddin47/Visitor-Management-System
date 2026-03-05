import { GripVertical } from "lucide-react"
import { cn } from "../../lib/utils"
import React from "react"

const ResizablePanelGroup = ({
  className,
  children,
  direction = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { direction?: string }) => (
  <div
    className={cn(
      "flex h-full w-full",
      direction === "vertical" ? "flex-col" : "flex-row",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const ResizablePanel = ({
  className,
  children,
  defaultSize,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { defaultSize?: number }) => (
  <div
    className={cn("h-full", className)}
    style={defaultSize ? { flexBasis: `${defaultSize}%`, flexShrink: 0 } : {}}
    {...props}
  >
    {children}
  </div>
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { withHandle?: boolean }) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
