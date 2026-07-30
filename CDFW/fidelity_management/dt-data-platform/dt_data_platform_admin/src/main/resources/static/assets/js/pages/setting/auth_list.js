(function () {
  "use strict";
  $(document).ready(function () {
    let tree = new Tree(".tree_container", {
      data: menuList,
      closeDepth: 3,
      loaded: function () {
        this.values = values;
      },
    });

    // 권한 등록
    $(".btn-register").on("click", function () {
      let auth = $("#auth").val();
      if (auth === "") {
        alert("권한을 선택하십시오.");
        return false;
      }
      let values = tree.getValues();
      if (values.length === 0) {
        alert("선택된 권한이 없습니다.");
        return false;
      }

      if (!confirm("저장하시겠습니까?")) {
        return false;
      }

      let data = {
        authCd: auth,
        values: values,
      };

      ajaxPost("/setting/auth/register", data, function (result) {
        if (result.result_code === 200) {
          //showAlert('4');
          window.location.reload();
        }
      });
    });
  });
})();
