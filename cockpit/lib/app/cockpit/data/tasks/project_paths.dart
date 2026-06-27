import 'dart:io';

/// Junta segmentos com o separador da plataforma (o projeto não depende do
/// pacote `path` — a convenção é `Platform.pathSeparator`, ver os filesystem
/// impls do shell).
String joinPath(String base, String segment) {
  final sep = Platform.pathSeparator;
  if (base.endsWith(sep)) return '$base$segment';
  return '$base$sep$segment';
}
