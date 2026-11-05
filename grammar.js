/**
 * @file Tree-sitter grammar for Kura
 * @author tazz
 * @license MIT
 */

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

    _definition: ($) =>
      choice(
        $.use_declaration,
        $.type_definition,
        $.function_definition,
        $.expression,
      ),

    use_declaration: ($) => seq("use", field("path", $.string)),

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
        repeat($.annotation),
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

    annotation: ($) =>
      seq(
        "@",
        field("name", $.identifier),
        optional(field("arguments", $.element_args)),
      ),

    // ==========================================
    // EXPRESSIONS & STATEMENTS
    // ==========================================

    expression: ($) =>
      choice(
        $.let_binding,
        $.if_expression,
        $.match_expression,
        $.for_expression,
        $.element_expression,
        $.instantiation_expression,
        $.binary_expression,
        $.pipe_expression,
        $.call_expression,
        $.array_expression,
        $.member_expression,
        $.identifier,
        $.type_identifier,
        $.wildcard,
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

    match_expression: ($) =>
      seq(
        "match",
        field("value", $.expression),
        "{",
        repeat(seq($.match_arm, optional(","))),
        "}",
      ),

    match_arm: ($) =>
      seq(field("pattern", $.expression), "=>", field("value", $.expression)),

    for_expression: ($) =>
      seq(
        "for",
        field("item", $.identifier),
        "in",
        field("iterable", $.expression),
        optional(seq("if", field("condition", $.expression))),
        optional(
          seq(
            "fold",
            field("accumulator", $.identifier),
            "=",
            field("initial", $.expression),
          ),
        ),
        "=>",
        field("body", $.expression),
      ),

    block: ($) => seq("{", repeat(seq($.expression, optional(";"))), "}"),

    binary_expression: ($) =>
      choice(
        prec.left(
          2,
          seq(field("left", $.expression), ">", field("right", $.expression)),
        ),
        prec.left(
          2,
          seq(field("left", $.expression), "<", field("right", $.expression)),
        ),
        prec.left(
          1,
          seq(field("left", $.expression), "+", field("right", $.expression)),
        ),
      ),

    pipe_expression: ($) =>
      prec.left(
        3,
        seq(field("left", $.expression), "|>", field("right", $.expression)),
      ),

    call_expression: ($) =>
      prec.left(
        4,
        seq(field("function", $.expression), "(", commaSep($.expression), ")"),
      ),

    array_expression: ($) => seq("[", commaSep($.expression), "]"),

    member_expression: ($) =>
      prec.left(
        5,
        seq(
          field("object", $.expression),
          ".",
          field("property", $.identifier),
        ),
      ),

    instantiation_expression: ($) =>
      seq(
        "{",
        optional(seq("...", field("spread", $.expression), ",")),
        commaSep($.instantiation_field),
        optional(","),
        "}",
      ),

    instantiation_field: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    // ==========================================
    // ELEMENT / MARKUP SYNTAX
    // ==========================================

    element_expression: ($) =>
      seq(
        repeat($.annotation),
        "#",
        field("tag", $.identifier),
        choice(
          seq(
            field("properties", $.element_args),
            optional(prec.dynamic(1, field("children", $.block))),
          ),
          prec.dynamic(1, field("children", $.block)),
          blank(),
        ),
      ),

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

    // Kebab-case aware identifiers: letters/underscores, allowing dashes in the middle
    identifier: ($) => /[a-z_][a-zA-Z0-9_-]*/,

    type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

    wildcard: ($) => "_",

    string: ($) => seq('"', repeat(/[^"\\]/), '"'),

    number: ($) => /-?\d+/, // Allows negative number literals smoothly

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
