package com.stoneitgt.dt.data.platform.admin.task;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum TaskType {
    MODEL,
    ETC_MODEL,
    DATA_AUGMENT
}