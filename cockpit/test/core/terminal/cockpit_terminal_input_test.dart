import 'package:cockpit/app/core/terminal/cockpit_terminal.dart';
import 'package:cockpit/app/core/terminal/xterm/xterm.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('commits an IME character only once', (tester) async {
    final output = <String>[];
    final terminal = Terminal(onOutput: output.add);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: CockpitTerminal(terminal, autofocus: true)),
      ),
    );
    await tester.pump();

    final textInput = tester.binding.testTextInput;
    for (final character in ['~', '´', 'á', 'í']) {
      final committed = TextEditingValue(
        text: character,
        selection: TextSelection.collapsed(offset: character.length),
      );
      textInput.updateEditingValue(committed);
      textInput.updateEditingValue(committed);
      textInput.updateEditingValue(committed);
      textInput.updateEditingValue(TextEditingValue.empty);
    }
    await tester.pump();

    expect(output, ['~', '´', 'á', 'í']);
  });
}
