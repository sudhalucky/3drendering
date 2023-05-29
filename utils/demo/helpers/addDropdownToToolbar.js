export default function addDropDownToToolbar({
  id,
  options,
  container,
  onSelectedValueChange,
}) {
  const { values, defaultValue } = options;
  const select = document.createElement('select');

  select.id = id;

  values.forEach((value) => {
    const optionElement = document.createElement('option');

    optionElement.value = String(value);
    optionElement.innerText = String(value);

    if (value === defaultValue) {
      optionElement.selected = true;
    }

    select.append(optionElement);
  });

  select.onchange = (evt) => {
    const selectElement = evt.target;

    if (selectElement) {
      onSelectedValueChange(selectElement.value);
    }
  };

  container = container ?? document.getElementById('demo-toolbar');
  container.append(select);
}
