export default grammar({
  name: "kura",

  extras: ($) => [/\s+/, /\/\/[^\n]*/],

  conflicts: ($) => [
    [$._expression, $.pattern],
    [$._primary, $.pattern],
    [$.recordPattern, $.record],
    [$.recordPattern, $.block],
    [$.record, $.block],
    [$.variantPattern, $.recordPattern],
    [$.variantPattern],
    [$._literal, $.rangeEnd],
    [$._primary, $.binding],
    [$._expression, $.binding],
    [$._primary, $.uiArg],
    [$._primary, $.lambda],
    [$._primary, $.path],
    [$._primary, $.recordEntry],
    [$._primary, $.arg],
    [$.uiElement],
    [$.params],
    [$._primary, $.uiChild],
    [$.type],
    [$.rangePattern],
    [$._expression, $.pipeChain],
    [$.pipeChain, $.lambda],
    [$.pipeChain, $.forExpr],
  ],

  precedences: ($) => [
    [
      "postfix",
      "unary",
      "multiplicative",
      "additive",
      "comparison",
      "equality",
      "is",
      "and",
      "or",
      "coalesce",
      "range",
      "compose",
      "pipe",
    ],
  ],

  rules: {
    source: ($) => repeat($._item),

    _item: ($) =>
      choice(
        seq(
          repeat($.directive),
          choice($.typeDecl, $.fnDecl, $.externDecl, $.useDecl, $.binding),
        ),
        $.setRule,
        $.staticAssert,
      ),

    binding: ($) =>
      choice(
        seq(
          "let",
          choice($.name, $.recordPattern),
          optional(seq(":", $.type)),
          "=",
          $._expression,
        ),
        seq($.name, "=", $._expression),
      ),

    typeDecl: ($) =>
      seq(
        "type",
        $.Name,
        optional(seq("<", $.Name, repeat(seq(",", $.Name)), ">")),
        "=",
        $.type,
      ),

    fnDecl: ($) =>
      seq(
        "fn",
        $.name,
        "(",
        optional($.params),
        ")",
        optional(seq(":", $.type)),
        "=>",
        repeat($.setRule),
        $._expression,
      ),

    externDecl: ($) =>
      seq(
        "extern",
        optional($.string),
        "fn",
        $.cName,
        "(",
        optional($.externParams),
        ")",
        ":",
        $.type,
        optional(seq("=>", $._expression)),
      ),

    useDecl: ($) =>
      seq("use", $.string, optional(seq("as", choice($.name, $.Name)))),

    setRule: ($) => seq("set", $.name, "(", optional($.uiArgs), ")"),

    staticAssert: ($) =>
      seq(
        "static-assert",
        "(",
        $._expression,
        optional(seq(",", $.string)),
        optional(","),
        ")",
      ),

    params: ($) => seq($.param, repeat(seq(",", $.param)), optional(",")),
    param: ($) => seq($.name, ":", $.type),

    externParams: ($) =>
      choice(seq($.params, optional(seq(",", "...")), optional(",")), "..."),

    cName: ($) => choice($.name, $.Name, $.raw_name),

    directive: ($) =>
      seq("@", $.name, optional(seq("(", optional($.uiArgs), ")"))),

    // ==========================================
    // TYPES
    // ==========================================
    type: ($) => seq($.typeMember, repeat(seq("|", $.typeMember))),

    typeMember: ($) =>
      choice(
        seq($.Name, "(", $.type, ")"),
        seq($.Name, optional($.typeArgs)),
        seq(choice($.name, $.Name), ".", $.cName, optional($.typeArgs)),
        "None",
        seq(
          "{",
          optional(seq($.field, repeat(seq(",", $.field)), optional(","))),
          "}",
        ),
        seq(
          "(",
          optional(seq($.type, repeat(seq(",", $.type)), optional(","))),
          ")",
          "=>",
          $.type,
        ),
      ),

    field: ($) => seq($.name, optional("?"), ":", $.type),
    typeArgs: ($) => seq("<", $.type, repeat(seq(",", $.type)), ">"),

    // ==========================================
    // EXPRESSIONS & OPERATOR HIERARCHY
    // ==========================================
    _expression: ($) => choice($.pipeChain, $._operation),

    pipeChain: ($) =>
      prec.left(
        "pipe",
        seq($._operation, choice(seq("|>", $.stage), seq("<|", $._operation))),
      ),

    stage: ($) => $._operation,

    _operation: ($) => $._compose,

    _compose: ($) =>
      prec.left(
        "compose",
        seq($._range, repeat(seq(choice(">>", "<<"), $._range))),
      ),

    _range: ($) =>
      prec.left(
        "range",
        choice(
          seq($._coalesce, choice("..", "..="), optional($._coalesce)),
          seq(choice("..", "..="), optional($._coalesce)),
          $._coalesce,
        ),
      ),

    _coalesce: ($) =>
      prec.right("coalesce", seq($._or, optional(seq("??", $._coalesce)))),

    _or: ($) => prec.left("or", seq($._and, repeat(seq("||", $._and)))),
    _and: ($) => prec.left("and", seq($._is, repeat(seq("&&", $._is)))),
    _is: ($) => prec.left("is", seq($._equality, repeat(seq("is", $.pattern)))),
    _equality: ($) =>
      prec.left(
        "equality",
        seq($._comparison, repeat(seq(choice("==", "!="), $._comparison))),
      ),
    _comparison: ($) =>
      prec.left(
        "comparison",
        seq(
          $._additive,
          repeat(seq(choice("<", "<=", ">", ">="), $._additive)),
        ),
      ),
    _additive: ($) =>
      prec.left(
        "additive",
        seq(
          $._multiplicative,
          repeat(seq(choice("+", "-"), $._multiplicative)),
        ),
      ),
    _multiplicative: ($) =>
      prec.left(
        "multiplicative",
        seq($._unary, repeat(seq(choice("*", "/", "%"), $._unary))),
      ),
    _unary: ($) =>
      prec.right("unary", seq(repeat(choice("-", "!")), $._postfix)),

    _postfix: ($) =>
      prec.left(
        "postfix",
        seq(
          $._primary,
          repeat(
            choice(
              seq(".", $.member),
              seq("?.", $.member),
              $.args,
              seq("?.", $.args),
              $.index,
              seq("?.", $.index),
            ),
          ),
        ),
      ),

    args: ($) =>
      seq(
        "(",
        optional(seq($.arg, repeat(seq(",", $.arg)), optional(","))),
        ")",
      ),
    arg: ($) => choice("_", $._expression),
    index: ($) => seq("[", $._expression, "]"),
    member: ($) => choice($.name, $.Name, $.raw_name, $.color),

    // ==========================================
    // PRIMARY EXPRESSIONS & CONTROL FLOW
    // ==========================================
    _primary: ($) =>
      choice(
        $.number,
        $.string,
        "true",
        "false",
        "None",
        $.unit,
        $.color,
        $.name,
        $.Name,
        "_",
        $.seq,
        $.comprehension,
        $.record,
        $.recordUpdate,
        $.block,
        $.ifExpr,
        $.whenExpr,
        $.matchExpr,
        $.forExpr,
        $.lambda,
        seq("(", $._expression, ")"),
        $.uiElement,
      ),

    seq: ($) =>
      seq(
        "[",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(",")),
        ),
        "]",
      ),
    comprehension: ($) => seq("[", $._expression, "for", $.forHead, "]"),

    lambda: ($) =>
      seq(
        "(",
        optional(seq($.name, repeat(seq(",", $.name)), optional(","))),
        ")",
        "=>",
        $._expression,
      ),

    record: ($) =>
      seq(
        "{",
        optional(
          seq($.recordEntry, repeat(seq(",", $.recordEntry)), optional(",")),
        ),
        "}",
      ),
    recordEntry: ($) =>
      choice(
        seq($.name, ":", $._expression),
        $.name,
        seq("...", $._expression),
      ),

    recordUpdate: ($) =>
      seq(
        "{",
        $.path,
        "|",
        $.updateEntry,
        repeat(seq(",", $.updateEntry)),
        optional(","),
        "}",
      ),
    path: ($) => seq($.name, repeat(seq(".", $.member))),
    updateEntry: ($) =>
      seq($.path, choice(":", "+=", "-=", "*=", "/=", "%="), $._expression),

    block: ($) =>
      seq(
        "{",
        repeat(choice($.binding, $.setRule, $.staticAssert, $._expression)),
        "}",
      ),

    ifExpr: ($) =>
      seq("if", $.condition, $.block, "else", choice($.ifExpr, $.block)),
    whenExpr: ($) => seq("when", $.condition, $.block),
    condition: ($) => $._expression,

    matchExpr: ($) =>
      seq(
        "match",
        $.condition,
        "{",
        $.arm,
        repeat(seq(optional(","), $.arm)),
        optional(","),
        "}",
      ),
    arm: ($) =>
      seq($.pattern, optional(seq("if", $._expression)), "=>", $._expression),

    forExpr: ($) =>
      seq(
        "for",
        $.forHead,
        optional(seq("fold", $.name, "=", $._expression)),
        "=>",
        $._expression,
      ),
    forHead: ($) =>
      seq(
        choice($.name, "_"),
        optional(seq(",", $.pattern)),
        "in",
        $._expression,
        optional(seq("if", $._expression)),
      ),

    // ==========================================
    // PATTERNS
    // ==========================================
    pattern: ($) =>
      choice(
        "_",
        $.name,
        "None",
        $.variantPattern,
        $.recordPattern,
        $.rangePattern,
        $._literal,
      ),

    variantPattern: ($) => seq($.Name, optional(seq("(", $.pattern, ")"))),
    recordPattern: ($) =>
      seq(
        optional($.Name),
        "{",
        optional(
          seq($.fieldPattern, repeat(seq(",", $.fieldPattern)), optional(",")),
        ),
        "}",
      ),
    fieldPattern: ($) =>
      choice(
        seq($.name, optional(seq(":", $.pattern))),
        seq("...", optional($.name)),
      ),

    _literal: ($) =>
      seq(
        optional("-"),
        choice($.number, $.unit, $.color, $.string, "true", "false"),
      ),

    rangePattern: ($) =>
      choice(
        seq($.rangeEnd, choice("..", "..="), optional($.rangeEnd)),
        seq(choice("..", "..="), $.rangeEnd),
      ),
    rangeEnd: ($) => seq(optional("-"), choice($.number, $.unit, $.color)),

    // ==========================================
    // UI ELEMENTS
    // ==========================================
    uiElement: ($) =>
      seq(
        repeat($.directive),
        "#",
        $.name,
        optional(seq("(", optional($.uiArgs), ")")),
        optional(seq("{", repeat($.uiChild), "}")),
      ),

    uiArgs: ($) => seq($.uiArg, repeat(seq(",", $.uiArg)), optional(",")),
    uiArg: ($) =>
      choice(
        seq($.name, ":", $._expression),
        $.name,
        seq("...", $._expression),
        $._expression,
      ),

    uiChild: ($) =>
      choice(
        $.uiElement,
        $.binding,
        $.setRule,
        $.string,
        $.unit,
        $.whenExpr,
        $.ifExpr,
        $.forExpr,
        $.matchExpr,
        $._expression,
      ),

    // ==========================================
    // LEXICAL RULES (Terminals)
    // ==========================================
    name: ($) => /[a-z_][A-Za-z0-9_]*(-[0-9]*[a-zA-Z_][A-Za-z0-9_]*)*/,
    Name: ($) => /[A-Z][A-Za-z0-9_]*/,
    raw_name: ($) => seq("`", repeat(/[^`\r\n]/), "`"),

    number: ($) => /[0-9]+(\.[0-9]+)?/,

    unit: ($) =>
      token(
        prec(
          2,
          choice(
            seq(/[0-9]+(\.[0-9]+)?/, "px"),
            seq(/[0-9]+(\.[0-9]+)?/, "%"),
            seq(/[0-9]+(\.[0-9]+)?/, "fr"),
          ),
        ),
      ),

    string: ($) =>
      seq(
        '"',
        repeat(choice(/[^"\\{\r\n]/, /\\[nt"\\{}]/, $.interpolation)),
        '"',
      ),

    interpolation: ($) => seq("{", $._expression, "}"),

    color: ($) =>
      choice(
        "black",
        "white",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "gray",
        "orange",
        "purple",
        "transparent",
      ),
  },
});
