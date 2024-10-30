const getObjectFromForm = (form: HTMLFormElement) => {
  let returnObject:any = {};
  const inputElements : NodeListOf<HTMLInputElement> = form.querySelectorAll('input:not([type="submit"])');
  inputElements.forEach((input:HTMLInputElement) => {
    if(""===input.value){
      return false;
    }
    if(input.type==="checkbox") {
      returnObject[input.name] = input.checked?input.value:"";
    }else{
      returnObject[input.name] = input.value;
    }
  });

  const selectElements : NodeListOf<HTMLSelectElement> = form.querySelectorAll('select');
  selectElements.forEach((select:HTMLSelectElement) => {
    if(""===select.value){
      return false;
    }
    returnObject[select.name] = select.value;
  });
  return returnObject;
}

const setFormInputValue = (form:HTMLFormElement, data:any) => {
  Object.keys(data).forEach( (key:string) => {
    const inputElement : HTMLInputElement | null = form.querySelector(`input:not([type="submit"])[name=${key}]`);
    if(null!=inputElement){
      inputElement.value = data[key];
      return true;
    }

    const selectElement : HTMLSelectElement | null = form.querySelector(`select[name=${key}]`);
    if(null!=selectElement){
      selectElement.value = data[key];
      return true;
    }

    console.log(`form has no key : "${key}`);
  })
}

export {getObjectFromForm, setFormInputValue};