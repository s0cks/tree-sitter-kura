(Name) @type

(number) @number
(unit) @number.float
(color) @constant.other.color
(string) @string
(escape) @string.escape

(name) @variable
(raw_name) @variable.member

"let" @keyword
"fn" @keyword.function
"type" @keyword.type
"use" @keyword
"as" @keyword
"extern" @keyword
"static-assert" @keyword
"set" @keyword

[
  "if"
  "else"
  "when"
  "match"
  "for"
  "in"
  "fold"
] @keyword.control

[
  "true"
  "false"
] @boolean

"None" @constant.builtin
"_" @variable.builtin

[
  "="
  "=>"
  "|>"
  "<|"
  ">>"
  "<<"
  ".."
  "..="
  "??"
  "||"
  "&&"
  "is"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  "+="
  "-="
  "*="
  "/="
  "%="
] @keyword.operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ":"
  "."
  "?."
  "|"
] @punctuation.delimiter

; ============================================================================
; 4. UI Elements & Macro Markers
; ============================================================================

"#" @punctuation.definition.tag
"@" @punctuation.definition.macro
