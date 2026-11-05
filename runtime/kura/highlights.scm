"type" @keyword.type
"use" @keyword.import

"fn" @keyword.function

[
 "let"
 "fold"
] @keyword

[
 "in"
 "for"
] @keyword.repeat

[
 "=>"
 "|>"
] @operator

[
 "if"
 "else"
 "match"
] @keyword.conditional

"@" @punctuation.macro
(annotation
  name: (identifier) @attribute)

(function_definition
  name: (identifier) @function)
(parameter
  name: (identifier) @variable.parameter)
(expression (identifier) @variable)

(parameter
  name: (identifier) @variable.parameter)

(record_field
  name: (identifier) @property)
(instantiation_field
  name: (identifier) @property)

(member_expression
  property: (identifier) @property)

(wildcard) @variable.builtin

"#" @punctuation.macro
(element_expression "#" (identifier) @tag)
(element_property (identifier) @tag.attribute ":")
(element_property ":" (expression (identifier) @variable))
(element_args (expression (identifier) @variable))

(type_identifier) @type
(string) @string
"\"" @string
(number) @number
(comment) @comment
