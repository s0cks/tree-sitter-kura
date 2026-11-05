[
 (block)
 (record_type)
 (instantiation_expression)
 (match_expression)
 (array_expression)
] @indent.begin

[
 "}"
 "]"
] @indent.end

[
 (parameter_list)
 (element_args)
 (variant_parameters)
] @indent.begin

")" @indent.end

(function_definition
  "=>" @indent.begin)

(let_binding
  "=" @indent.begin)

(for_expression
  "=>" @indent.begin)

(match_arm
  "=>" @indent.begin)
