; ==========================================
; Function Definitions
; ==========================================

; 'af' - Around Function (captures annotations, signature, and body)
(function_definition) @function.outer

; 'if' - Inside Function Body
(function_definition
  body: (_) @function.inner)

; ==========================================
; Parameters & Arguments
; ==========================================

; 'aa' - Around Argument (captures parameter name, type, and separating commas)
(parameter) @parameter.outer
(element_property) @parameter.outer

; 'ia' - Inside Argument/Value
(parameter
  name: (identifier) @parameter.inner)

(element_property
  value: (expression) @parameter.inner)

(element_args
  (expression) @parameter.inner)

; ==========================================
; Conditionals & Control Flow
; ==========================================

; 'ac' - Around Conditional scope
(if_expression) @conditional.outer
(match_expression) @conditional.outer

; 'ic' - Inside Conditional blocks
(if_expression
  consequence: (block) @conditional.inner
  alternative: (block)? @conditional.inner)

(match_expression
  (match_arm) @conditional.inner)

; ==========================================
; Loops & Comprehensions
; ==========================================

; 'al' / 'il' - Around/Inside Loops
(for_expression) @loop.outer
(for_expression
  body: (expression) @loop.inner)
