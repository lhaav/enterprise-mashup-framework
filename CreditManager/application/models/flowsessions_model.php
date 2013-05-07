<?php

/**
 * Flow sessions operations
 */
class FlowSessions_model extends CI_Model {

  public function FlowSessions_model() {
    parent::__construct();
    // Database table names
    $this->config->load('tables');
    $this->load->helper('database_helper');
    $this->load->helper('date');
  }
  
  /**
   * Add a flow session
   * 
   * @param  string $flowsession
   * @return void
   */
  public function add($flowsession) {
    $this->db->insert(table('flowsessions_table'), $flowsession); 
  }

  /**
   * Get flowsessions for main window
   * 
   * @param  string $condition Condition to find flow sessions
   * @return array  Flow sessions
   */
  public function getFlowSessions($condition) {
    $this->db->select(
      table('flowsessions_table') . '.id, ' . 
      table('flowsessions_table') . '.filenameunique, ' . 
      table('flowsessions_table') . '.filenamealias, ' . 
      table('flowsessions_table') . '.uploadtimestamp, ' . 'userowner.email as owner, ' . 'useruploader.email as uploader, ' .
      table('flowsessions_table') . '.notes'
    );

    $this->db->join(table('users_table') . ' AS userowner', 
      table('flowsessions_table') . '.ownerid = userowner.id'
    );
    $this->db->join(table('users_table') . ' AS useruploader',  
      table('flowsessions_table') . '.uploaderid = useruploader.id'
    );
    
    if (!empty($condition)) {
      $this->db->where(table('flowsessions_table') . '.' . $condition['field'], $condition['value']);
    }
    
    $this->db->order_by('id', 'desc');

    $query = $this->db->get(table('flowsessions_table'));
    $flowsessions  = $query->result();
    
    // Date format pp.kk.aaaa
    $dateFormat = '%d.%m.%Y %H:%i';
  
    foreach ($flowsessions as $flowsession) {
      $unix  = mysql_to_unix($flowsession->uploadtimestamp);
      $flowsession->uploadtimestamp= mdate($dateFormat, $unix);
    }
    
    return $flowsessions;
  }

}