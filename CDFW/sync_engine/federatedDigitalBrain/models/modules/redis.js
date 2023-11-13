class Redis {
   /**
    * 배열에 추가
    * @param {String} name (required)
    * @returns {}
    */
   rpush({ key, name }) {
      return Rclient.rpush(key, name);
   }

   /**
    * 이름에 obj 삽입
    * @param {String} name (required)
    * @param {Json} obj (required)
    * @returns {}
    */
   set({ name, obj }) {
      return Rclient.set(name, JSON.stringify(obj));
   }

   /**
    * name으로 조회
    * @param {String} name (required)
    * @returns {Promise}
    */
   get({ name }) {
      return new Promise((resolve, reject) => {
         Rclient.get(name, (err, value) => {
            if (err) {
               reject(err);
            }
            resolve(JSON.parse(value));
         });
      });
   }

   /**
    * set에서 name 삭제
    * @param {String} name (required)
    * @returns
    */
   delete({ name }) {
      return Rclient.DEL(name);
   }

   /**
    * 리스트에서 name 삭제
    * @param {String} name (required)
    * @returns
    */
   removeFromList({ key, name }) {
      return Rclient.LREM(key, -1, name);
   }

   /**
    * hash map 저장
    * key에 여러개의 field와 value를 저장할 수 있다
    * 기존에 같은 field가 있으면 덮어쓴다
    * key마다 field 가 달라도 된다
    */
   hset({ key, field, value }) {
      return Rclient.hset(key, field, value);
   }

   /**
    * hkeys key
    * key에 속한 모든 field name을 조회
    * field name은 입력된 순서대로 나온다.
    * @param {string} name
    * @returns
    */
   getKeys({ name }) {
      return new Promise((resolve, reject) => {
         Rclient.hkeys(name, (err, value) => {
            if (err) {
               reject(err);
            }
            resolve(value);
         });
      });
   }

   /**
    * hget key field
    * field로 value를 조회
    * 지정한 field로 value를 조회한다
    * @param {string} name
    * @param {string} key
    * @returns
    */
   getValue({ name, key }) {
      return new Promise((resolve, reject) => {
         Rclient.hget(name, key, (err, value) => {
            if (err) {
               reject(err);
            }
            if (key == "arg") {
               resolve(JSON.parse(value));
            } else {
               resolve(value);
            }
         });
      });
   }

   /**
    * redis의 특정 키에 저장된 모든 이름 조회
    * @param {String} key (required)
    * @returns {String Array} [] redis에 저장된 모든 key들의 이름
    */
   getNameList(key) {
      return new Promise((resolve, reject) => {
         Rclient.lrange(key, 0, -1, (err, keys) => {
            if (err) reject(err);
            resolve(keys);
         });
      });
   }

   /**
    * redis의 특정 키에 해당 이름이 사용 여부 체크
    * @param {String} name (required)
    * @param {String} key (required)
    * @returns {Boolean} true = 이미 존재 하는 이름
    */
   checkNameExist({ name, key }) {
      let flag = false;

      const nameList = this.getNameList(key);

      // if (nameList.some((existName) => existName == name)) {
      //    flag = true;
      // }

      return flag;
   }

   async getListLength_delete({ key }) {
      const keys = new Promise((resolve, reject) => {
         Rclient.lrange(key, 0, -1, (err, keys) => {
            if (err) {
               reject(err);
            }
            keys.forEach((key) => {
               Rclient.DEL(key);
            });
            resolve(keys);
         });
      });
      return keys;
   }

   async publish({ channel, message }) {
      const result = await Rclient.publish(channel, JSON.stringify(message));
      return result;
   }
}

module.exports = Redis;
