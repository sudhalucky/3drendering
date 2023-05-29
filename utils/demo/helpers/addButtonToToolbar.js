export default function addButtonToToolbar({
  id,
  title,
  container,
  onClick,
}) {
  const button = document.createElement('button');

  button.id = id;
  button.innerHTML = title;
  button.onclick = onClick;

  container = container ?? document.getElementById('demo-toolbar');
  container.append(button);
}
