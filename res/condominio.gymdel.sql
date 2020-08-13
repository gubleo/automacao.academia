create or replace function condominio.gymdel(params json) returns SETOF acesso.reserva_academia
    language plpgsql
as $$
    /** {data: data, horario: horario, morador: morador} **/
declare
    _id int;
    _usuario varchar;
    _registro record;

begin

    _id := params->>'id';
    _usuario := params->>'usuario';

    select *
    into _registro
    from acesso.reserva_academia
    where id = _id;

    insert into expurgo.reserva_academia (autenticacao, data, horario, purgeuser)
    values (_registro.autenticacao, _registro.data, _registro.horario, _usuario);

    return query
        delete
            from acesso.reserva_academia
                where id = _id returning *;


end
$$;

alter function condominio.gymdel(json) owner to postgres;

