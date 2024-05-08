export interface Minifig {
    set_num:          string;
    name:             string;
    num_parts:        number;
    set_img_url:      string;
    set_url:          string;
    last_modified_dt: Date;
}

export interface Set {
    set_num:          string;
    name:             string;
    year:             number;
    theme_id:         number;
    num_parts:        number;
    set_img_url:      string;
    set_url:          string;
    last_modified_dt: Date;
}