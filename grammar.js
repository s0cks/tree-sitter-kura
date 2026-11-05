export default grammar({
  name: "kura",

  // Ensure keywords don't accidentally match substrings of identifiers
  word: ($) => $.identifier,

  extras: ($) => [
    /\s/, // Whitespace
    $.comment, // Comments
  ],

  conflicts: ($) => [
    [$.type_expr, $.expression],
    [$.variant, $.type_expr],
    [$.block, $.instantiation_expression], // FIXES THE CURLY BRACE AMBIGUITY
  ],

  rules: {
    // Top-level entry point
    source_file: ($) => repeat($._definition),

    _definition: ($) => choice($.type_definition, $.function_definition),

    // ==========================================
    // TYPE DEFINITIONS
    // ==========================================

    type_definition: ($) =>
      seq(
        "type",
        field("name", $.type_identifier),
        optional(field("type_params", $.type_parameters)),
        "=",
        field("body", $._type_body),
      ),

    type_parameters: ($) => seq("<", commaSep1($.type_identifier), ">"),

    _type_body: ($) =>
      choice($.sum_type, $.record_type, $.arrow_type, $.type_expr),

    record_type: ($) => seq("{", commaSep($.record_field), optional(","), "}"),

    record_field: ($) =>
      seq(
        field("name", $.identifier),
        optional(field("optional", "?")),
        ":",
        field("type", $.type_expr),
      ),

    sum_type: ($) => sep1($.variant, "|"),

    variant: ($) =>
      seq(
        field("name", $.type_identifier),
        optional(field("parameters", $.variant_parameters)),
      ),

    variant_parameters: ($) => seq("(", commaSep1($.type_expr), ")"),

    arrow_type: ($) =>
      seq(
        field("parameters", $.arrow_type_parameters),
        "=>",
        field("return_type", $.type_expr),
      ),

    arrow_type_parameters: ($) => seq("(", commaSep($.type_expr), ")"),

    type_expr: ($) =>
      seq(
        field("name", $.type_identifier),
        optional(field("arguments", $.type_arguments)),
      ),

    type_arguments: ($) => seq("<", commaSep1($.type_expr), ">"),

    // ==========================================
    // FUNCTION DEFINITIONS
    // ==========================================

    function_definition: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq(":", field("return_type", $.type_expr))),
        "=>",
        field("body", $.block),
      ),

    parameter_list: ($) => seq("(", commaSep($.parameter), ")"),

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type_expr)),

    // ==========================================
    // EXPRESSIONS & STATEMENTS
    // ==========================================

    expression: ($) =>
      choice(
        $.let_binding,
        $.if_expression,
        $.element_expression,
        $.instantiation_expression,
        $.binary_expression,
        $.identifier,
        $.type_identifier, // Handles cases like None or Tick in expressions
        $.string,
        $.number,
        $.block,
      ),

    let_binding: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $.expression),
      ),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        field("consequence", $.block),
        "else",
        field("alternative", $.block),
      ),

    block: ($) => seq("{", repeat($.expression), "}"),

    binary_expression: ($) =>
      choice(
        prec.left(
          1,
          seq(field("left", $.expression), ">", field("right", $.expression)),
        ),
        // Add other operators here as your compiler targets them
      ),

    instantiation_expression: ($) =>
      seq("{", commaSep($.instantiation_field), optional(","), "}"),

    instantiation_field: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    // ==========================================
    // ELEMENT / MARKUP SYNTAX
    // ==========================================

    element_expression: ($) =>
      seq(
        "#",
        field("tag", $.identifier),
        optional(field("arguments", $.element_arguments)),
        field("body", $.block),
      ),

    element_arguments: ($) => seq("(", commaSep($.element_argument), ")"),

    element_argument: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    // ==========================================
    // LEXICAL ATOMS & IDENTIFIERS
    // ==========================================

    // Lowercase identifiers (variables, fields, function names, element tags)
    identifier: ($) => /[a-z_][a-zA-Z0-9_]*/,

    // Uppercase identifiers (types, union variants)
    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    string: ($) => seq('"', repeat(/[^"\\]/), '"'),

    number: ($) => /\d+/,

    comment: ($) => /\/\/[^\n]*/,
  },
});

// Helper functions for common separation rules
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return sep1(rule, ",");
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
