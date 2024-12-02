const customAlert = (message: string) => {
    alert(message);
}

const customConfirm = (message: string) => {
    return confirm(message)
}

export { customAlert, customConfirm };