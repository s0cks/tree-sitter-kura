export default grammar({
  name: "kura",

  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    [$.type_expr, $.expression],
    [$.variant, $.type_expr],
    [$.block, $.instantiation_expression],
    [$.element_expression],
  ],

  rules: {
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
        field("body", $.expression),
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
        $.type_identifier,
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
        optional(seq("else", field("alternative", $.block))),
      ),

    block: ($) => seq("{", repeat($.expression), "}"),

    binary_expression: ($) =>
      choice(
        prec.left(
          1,
          seq(field("left", $.expression), ">", field("right", $.expression)),
        ),
      ),

    instantiation_expression: ($) =>
      seq("{", commaSep($.instantiation_field), optional(","), "}"),

    instantiation_field: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    // ==========================================
    // ELEMENT / MARKUP SYNTAX
    // ==========================================

    element_expression: ($) =>
      choice(
        // Path 1: Tag with attributes/arguments and an attached block
        prec(
          3,
          seq(
            "#",
            field("tag", $.identifier),
            field("properties", $.element_args),
            field("children", $.block),
          ),
        ),

        // Path 2: Tag straight to children block (e.g., #fragment { ... })
        prec(
          3,
          seq("#", field("tag", $.identifier), field("children", $.block)),
        ),

        // Path 3: Standalone leaf tag macro call (e.g. #text(text) or #text("Close"))
        prec(
          2,
          seq(
            "#",
            field("tag", $.identifier),
            optional(field("properties", $.element_args)),
          ),
        ),
      ),

    // FIXED: Supports both named properties (fill: red) AND plain positional expressions ("Close")
    element_args: ($) =>
      seq(
        "(",
        choice(commaSep1($.element_property), commaSep1($.expression)),
        ")",
      ),

    element_property: ($) =>
      seq(field("key", $.identifier), ":", field("value", $.expression)),

    // ==========================================
    // LEXICAL ATOMS & IDENTIFIERS
    // ==========================================

    identifier: ($) => /[a-z_][a-zA-Z0-9_]*/,

    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    string: ($) => seq('"', repeat(/[^"\\]/), '"'),

    number: ($) => /\d+/,

    comment: ($) => /\/\/[^\n]*/,
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return sep1(rule, ",");
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
