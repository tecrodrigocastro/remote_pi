import 'package:cockpit/app/cockpit/domain/contracts/task_adapter.dart';
import 'package:cockpit/app/cockpit/domain/contracts/task_discovery.dart';
import 'package:cockpit/app/cockpit/domain/entities/task_definition.dart';

/// Agrega os [TaskAdapter]s registrados. Mesmo padrão multi-marcador do
/// `project_root_finder`: pergunta a cada adapter se reconhece o projeto e
/// concatena as tasks dos que reconhecem.
///
/// TODO(plano 48 · passo 5): mesclar `.cockpit/tasks.json` (manual) por cima.
class TaskDiscoveryImpl implements TaskDiscovery {
  TaskDiscoveryImpl(this._adapters);

  final List<TaskAdapter> _adapters;

  @override
  Future<List<TaskDefinition>> discover(String cwd) async {
    if (cwd.isEmpty) return const [];
    final results = await Future.wait(
      _adapters.map((a) async {
        return await a.matches(cwd)
            ? await a.tasksFor(cwd)
            : const <TaskDefinition>[];
      }),
    );
    return [for (final list in results) ...list];
  }
}
