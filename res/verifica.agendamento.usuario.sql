create function verifica_agendamento_usuario(_autenticacao character varying, _local character varying) returns boolean
    language plpgsql
as
$$
    /**
      Verifica se existe um agendamento para o usuário no espaço informado
     */
declare
    _id record;
begin

    select id
    into _id
    from acesso.reserva_academia
    where upper(autenticacao) = upper(_autenticacao)
      and local = _local
      and data = current_date
      and (horario || ':00:00')::time
        between
        to_char(current_timestamp, 'HH24:00:00')::time
        and to_char((current_timestamp + interval '5' minute), 'HH24:MI:ss')::time;

    if (_id is null) then
        return false;
    end if;

    update acesso.reserva_academia
    set confirmado = true
    where id = _id.id;

    return true;
end
$$;

alter function verifica_agendamento_usuario(varchar, varchar) owner to postgres;