class Page(object):
    def paging(param=None):
        page = int(param["page"])
        page_size = int(param["page_size"])
        limit = int(page_size * page)
        offset = int(limit - page_size)
        #page_count = ceil(TbTestUser.objects.count() / page_size)

        result = {'offset': offset, 'limit': limit}
        return result

    def makeQuery(sql, pagedata):
        if int(pagedata.get('offset')) == 0:
            offset = 1
        else:
            offset = pagedata.get('offset')

        if int(pagedata.get('limit')) == 0:
            limit = 1
        else:
            limit = pagedata.get('limit')

        tmp = "SELECT CAST(@ROWNUM := @ROWNUM + 1 AS INT) RNUM, X2.* \n"
        tmp += "       FROM ( SELECT COUNT(1) OVER() AS TOTAL_COUNT, X1.* \n"
        tmp += "              FROM ( \n"
        tmp += sql
        tmp += "              ) X1"
        #tmp += "        " + suffixSql + " \n"
        tmp += "        LIMIT " + str(int(offset) - 1) + "," + str(limit) + " ) X2 \n"
        tmp += "INNER JOIN (SELECT @ROWNUM := " + str(int(offset) - 1) + ") XR1 \n"
        #tmp += " " + suffixSql + " \n"

        result = tmp

        return result