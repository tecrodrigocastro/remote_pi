import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:cockpit/app/cockpit/domain/contracts/terminal_status_server.dart';
import 'package:cockpit/app/core/data/setup/remote_pi_resolver.dart';
import 'package:flutter/foundation.dart';

/// [TerminalStatusServer] híbrido por plataforma:
/// - **POSIX**: socket Unix em `~/.cockpit/status.sock` (permissão do arquivo
///   já protege contra outros usuários).
/// - **Windows**: TCP loopback `127.0.0.1:<porta-efêmera>` + **token**
///   (loopback é acessível por qualquer processo local; o token valida a
///   origem). O Dart não suporta socket Unix no Windows.
///
/// Cada conexão do `cockpit-hook` manda **uma linha JSON** (`{paneId, st, sid,
/// tx, tok?}`) e fecha.
class TerminalStatusServerImpl implements TerminalStatusServer {
  TerminalStatusServerImpl();

  ServerSocket? _server;
  void Function(ClaudeStatusUpdate update)? _onUpdate;
  String? _token; // só no Windows/TCP

  String get _socketPath {
    final home = remotePiHome() ?? Directory.systemTemp.path;
    return '$home/.cockpit/status.sock';
  }

  @override
  Map<String, String> get hookEnv {
    final server = _server;
    if (server == null) return const <String, String>{};
    if (Platform.isWindows) {
      final env = <String, String>{'COCKPIT_STATUS_PORT': '${server.port}'};
      final token = _token;
      if (token != null) env['COCKPIT_STATUS_TOKEN'] = token;
      return env;
    }
    return <String, String>{'COCKPIT_STATUS_SOCK': _socketPath};
  }

  @override
  Future<void> start(void Function(ClaudeStatusUpdate update) onUpdate) async {
    if (_server != null) return;
    _onUpdate = onUpdate;
    try {
      if (Platform.isWindows) {
        _token = _randomToken();
        _server = await ServerSocket.bind(InternetAddress.loopbackIPv4, 0);
      } else {
        final file = File(_socketPath);
        await file.parent.create(recursive: true);
        // Remove socket órfão do ciclo anterior (bind falha se já existe).
        if (await file.exists()) await file.delete();
        final address = InternetAddress(
          _socketPath,
          type: InternetAddressType.unix,
        );
        _server = await ServerSocket.bind(address, 0);
      }
      _server!.listen(_handleConnection, onError: (_) {});
    } catch (e) {
      if (kDebugMode) debugPrint('[status-server] bind falhou: $e');
    }
  }

  String _randomToken() {
    final r = Random.secure();
    return List<int>.generate(16, (_) => r.nextInt(256))
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
  }

  void _handleConnection(Socket socket) {
    // Acumula a linha; a conexão é curta (um JSON + close).
    final buffer = StringBuffer();
    socket
        .cast<List<int>>()
        .transform(utf8.decoder)
        .listen(
          buffer.write,
          onDone: () {
            _dispatch(buffer.toString());
            socket.destroy();
          },
          onError: (_) => socket.destroy(),
          cancelOnError: true,
        );
  }

  void _dispatch(String raw) {
    final line = raw.trim();
    if (line.isEmpty) return;
    try {
      final decoded = jsonDecode(line);
      if (decoded is! Map) return;
      // No Windows/TCP, exige o token (anti-spoof do loopback).
      if (_token != null && decoded['tok'] != _token) return;
      final paneId = (decoded['paneId'] ?? '').toString();
      final status = (decoded['st'] ?? '').toString();
      if (paneId.isEmpty || status.isEmpty) return;
      final sid = (decoded['sid'] ?? '').toString();
      final tx = (decoded['tx'] ?? '').toString();
      _onUpdate?.call(
        ClaudeStatusUpdate(
          paneId: paneId,
          status: status,
          sessionId: sid.isEmpty ? null : sid,
          transcriptPath: tx.isEmpty ? null : tx,
        ),
      );
    } catch (_) {
      /* linha malformada: ignora */
    }
  }

  @override
  Future<void> stop() async {
    await _server?.close();
    _server = null;
    _onUpdate = null;
    _token = null;
    if (!Platform.isWindows) {
      try {
        final file = File(_socketPath);
        if (await file.exists()) await file.delete();
      } catch (_) {}
    }
  }
}
