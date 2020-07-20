create or replace function acesso.verifica_agendamento_usuario(_autenticacao character varying, _equipamento integer) returns boolean
    language plpgsql
as
$$
    /**
      Verifica se existe um agendamento para o usuário no espaço informado
     */
declare
begin
    if (
        select count(*)
        from acesso.reserva_academia
        where upper(autenticacao) = upper('1EBC5')
          and data = current_date
          and (horario || ':00:00')::time
              between
                to_char(current_timestamp, 'HH24:00:00')::time
                and to_char((current_timestamp + interval '5' minute), 'HH24:MI:ss')::time
    ) = 0 then
        return false;
    end if;
    return true;
end
$$;