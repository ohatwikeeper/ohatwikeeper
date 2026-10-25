import { defineArea } from '../area'

// 個人用APIキーの複数管理(ak.*)
export default defineArea({
  'ak.name': ['キー名', 'Key name', '키 이름', 'Schlüsselname', 'Nom de la clé', 'Nombre de la clave', '密钥名称', 'Nome da chave', 'Nome della chiave', 'Название ключа'],
  'ak.namePh': ['例: ohax-cli、自宅PC', 'e.g. ohax-cli, home PC', '예: ohax-cli, 집 PC', 'z. B. ohax-cli, Heim-PC', 'ex. ohax-cli, PC maison', 'p. ej. ohax-cli, PC de casa', '例如:ohax-cli、家里的电脑', 'ex.: ohax-cli, PC de casa', 'es. ohax-cli, PC di casa', 'напр. ohax-cli, домашний ПК'],
  'ak.note': ['メモ', 'Note', '메모', 'Notiz', 'Note', 'Nota', '备注', 'Nota', 'Nota', 'Заметка'],
  'ak.notePh': ['用途など(任意)', 'What it is used for (optional)', '용도 등(선택)', 'Verwendungszweck (optional)', 'Usage, etc. (facultatif)', 'Para qué se usa (opcional)', '用途等(可选)', 'Finalidade (opcional)', 'Scopo d’uso (facoltativo)', 'Назначение (необязательно)'],
  'ak.create': ['キーを作成', 'Create key', '키 만들기', 'Schlüssel erstellen', 'Créer une clé', 'Crear clave', '创建密钥', 'Criar chave', 'Crea chiave', 'Создать ключ'],
  'ak.made': ['作成', 'Created', '생성', 'Erstellt', 'Créée', 'Creada', '创建', 'Criada', 'Creata', 'Создан'],
  'ak.lastUsed': ['最終利用', 'Last used', '마지막 사용', 'Zuletzt verwendet', 'Dernière utilisation', 'Último uso', '最近使用', 'Último uso', 'Ultimo utilizzo', 'Последнее использование'],
  'ak.never': ['未使用', 'Never used', '사용 안 함', 'Nie verwendet', 'Jamais utilisée', 'Sin usar', '未使用', 'Nunca usada', 'Mai usata', 'Не использовался'],
  'ak.edit': ['編集', 'Edit', '편집', 'Bearbeiten', 'Modifier', 'Editar', '编辑', 'Editar', 'Modifica', 'Изменить'],
  'ak.save': ['保存', 'Save', '저장', 'Speichern', 'Enregistrer', 'Guardar', '保存', 'Salvar', 'Salva', 'Сохранить'],
  'ak.cancel': ['キャンセル', 'Cancel', '취소', 'Abbrechen', 'Annuler', 'Cancelar', '取消', 'Cancelar', 'Annulla', 'Отмена'],
  'ak.unnamed': ['名称未設定', 'Untitled', '이름 없음', 'Ohne Namen', 'Sans nom', 'Sin nombre', '未命名', 'Sem nome', 'Senza nome', 'Без названия'],
  'ak.limit': ['APIキーは最大{{n}}個まで作成できます', 'You can create up to {{n}} API keys', 'API 키는 최대 {{n}}개까지 만들 수 있습니다', 'Sie können bis zu {{n}} API-Schlüssel erstellen', 'Vous pouvez créer jusqu’à {{n}} clés API', 'Puedes crear hasta {{n}} claves API', '最多可创建 {{n}} 个 API 密钥', 'Você pode criar até {{n}} chaves de API', 'Puoi creare fino a {{n}} chiavi API', 'Можно создать до {{n}} API-ключей'],
  'ak.createdMsg': ['APIキーを作成しました', 'API key created', 'API 키를 만들었습니다', 'API-Schlüssel erstellt', 'Clé API créée', 'Clave API creada', '已创建 API 密钥', 'Chave de API criada', 'Chiave API creata', 'API-ключ создан'],
  'ak.savedMsg': ['保存しました', 'Saved', '저장했습니다', 'Gespeichert', 'Enregistré', 'Guardado', '已保存', 'Salvo', 'Salvato', 'Сохранено'],
  'ak.fail': ['操作に失敗しました', 'Action failed', '작업에 실패했습니다', 'Aktion fehlgeschlagen', 'Échec de l’action', 'La acción falló', '操作失败', 'A ação falhou', 'Operazione non riuscita', 'Не удалось выполнить действие'],
})
