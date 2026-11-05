; ==========================================
; Structural Top-Level Definitions
; ==========================================

; Fold the entire body of a function or type declaration
(function_definition
  body: (_) @fold)

(type_definition
  body: (_) @fold)

; ==========================================
; Blocks & Record Layouts
; ==========================================

; Fold explicit curly brace blocks, arrays, and record bodies
(block) @fold
(record_type) @fold
(instantiation_expression) @fold
(array_expression) @fold

; ==========================================
; Control Flow Constructs
; ==========================================

; Fold the body branches of conditional loops and match scopes
(if_expression
  consequence: (block) @fold
  alternative: (block) @fold)

(match_expression) @fold

; Fold multi-line comment groups together
(comment) @fold
