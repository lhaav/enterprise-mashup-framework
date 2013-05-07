<?php

/**
 * User account operations
 */
class Mashup_model extends CI_Model {

  public function Mashup_model() {
    parent::__construct();
    // Database table names
    $this->config->load('tables');
    $this->load->helper('database_helper');
  }
  
  /**
   * Registered account activation
   * 
   * @param  string $activationcode activation code sent to user
   * @return boolean true, if activation was successful, false otherwise            
   */
  public function addMashupMessage($flowsession, $message) {
    $data = array();
    $data['sessionid'] = $flowsession;
    $data['topic'] = 'CreditManager.Data.InvoiceList';
    $data['message'] = $message;
    $data['timestamp'] = date('Y-m-d H:i:s');
    $this->db->insert(table('widgetsessions_table'), $data);
  }

}