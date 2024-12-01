const showRegistDataButton = () => {
    if(window.userRole==='ROLE_SYSTEM'
      || window.userRole==='ROLE_MANAGER'
      || window.userRole==='ROLE_MEMBER_ADMIN'
      || window.userRole==='ROLE_MEMBER'
      || window.userRole==='ROLE_USER') return true;
    return false;
}

export { showRegistDataButton };