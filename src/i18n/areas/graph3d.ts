import { defineArea } from '../area'

// 3Dグラフ。並び: ja, en, ko, de, fr, es, zh, pt, it, ru
export default defineArea({
  'g3.title': ['3Dグラフ', '3D graph', '3D 그래프', '3D-Diagramm', 'Graphique 3D', 'Gráfico 3D', '3D图表', 'Gráfico 3D', 'Grafico 3D', '3D-график'],
  'g3.open': ['3Dで見る', 'View in 3D', '3D로 보기', 'In 3D ansehen', 'Voir en 3D', 'Ver en 3D', '3D查看', 'Ver em 3D', 'Vedi in 3D', 'Смотреть в 3D'],
  'g3.back': ['通常のグラフ', 'Normal graph', '일반 그래프', 'Normales Diagramm', 'Graphique normal', 'Gráfico normal', '普通图表', 'Gráfico normal', 'Grafico normale', 'Обычный график'],
  'g3.desc': ['{{name}}さんの1年分を、柱の高さで表した立体グラフ。ドラッグで回転、ホイールで拡大縮小。', "{{name}}'s past year as a 3D bar chart. Drag to rotate, scroll to zoom.", '{{name}}님의 1년을 기둥 높이로 표현한 3D 그래프. 드래그로 회전, 휠로 확대/축소.', 'Das letzte Jahr von {{name}} als 3D-Säulendiagramm. Ziehen zum Drehen, Scrollen zum Zoomen.', "L'année de {{name}} en barres 3D. Glissez pour tourner, molette pour zoomer.", 'El último año de {{name}} en barras 3D. Arrastra para girar, rueda para hacer zoom.', '{{name}}过去一年的3D柱状图。拖动旋转,滚轮缩放。', 'O último ano de {{name}} em barras 3D. Arraste para girar, role para ampliar.', "L'ultimo anno di {{name}} in barre 3D. Trascina per ruotare, scorri per zoomare.", 'Последний год {{name}} в виде 3D-столбцов. Тяните для вращения, колесо для масштаба.'],
  'g3.empty': ['表示できるデータがありません', 'No data to show', '표시할 데이터가 없습니다', 'Keine Daten vorhanden', 'Aucune donnée à afficher', 'No hay datos para mostrar', '没有可显示的数据', 'Sem dados para mostrar', 'Nessun dato da mostrare', 'Нет данных для показа'],
  'g3.auto': ['自動で回転', 'Auto rotate', '자동 회전', 'Automatisch drehen', 'Rotation auto', 'Girar automático', '自动旋转', 'Girar automático', 'Rotazione auto', 'Автовращение'],
})
